import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Layers,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
} from 'lucide-react';
import { RoomAvailabilityInfo, Room } from '../../types';
import { BUILDING_FLOORS } from '../../data/roomsData';

interface BuildingMap3DProps {
  roomsAvailability: RoomAvailabilityInfo[];
  onSelectRoom: (info: RoomAvailabilityInfo) => void;
  selectedRoomId?: string | null;
}

export const BuildingMap3D: React.FC<BuildingMap3DProps> = ({
  roomsAvailability,
  onSelectRoom,
  selectedRoomId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeFloorFilter, setActiveFloorFilter] = useState<number | 'all'>('all');
  const [hoveredRoom, setHoveredRoom] = useState<RoomAvailabilityInfo | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const roomMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Orbit controls state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 36 });

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16); // dark slate 950
    scene.fog = new THREE.FogExp2(0x090d16, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const bluePointLight = new THREE.PointLight(0x6366f1, 2, 50);
    bluePointLight.position.set(0, 20, 0);
    scene.add(bluePointLight);

    // 5. Ground Grid
    const grid = new THREE.GridHelper(40, 40, 0x334155, 0x1e293b);
    grid.position.y = -1;
    scene.add(grid);

    // 6. Build 3D Building Floor Plates & Rooms
    buildBuildingGeometry(scene);

    // 7. Raycasting for Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
      setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });

      if (isDraggingRef.current) {
        const deltaX = event.clientX - previousMousePositionRef.current.x;
        const deltaY = event.clientY - previousMousePositionRef.current.y;

        cameraAngleRef.current.theta -= deltaX * 0.008;
        cameraAngleRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - deltaY * 0.008)
        );
        updateCameraPosition();
        previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
        return;
      }

      // Hover check
      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(roomMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const roomId = hitMesh.userData.roomId;
        const matched = roomsAvailability.find((r) => r.room.id === roomId);
        setHoveredRoom(matched || null);
        container.style.cursor = 'pointer';
      } else {
        setHoveredRoom(null);
        container.style.cursor = 'default';
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(roomMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const roomId = hitMesh.userData.roomId;
        const matched = roomsAvailability.find((r) => r.room.id === roomId);
        if (matched) {
          onSelectRoom(matched);
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraAngleRef.current.radius = Math.max(
        15,
        Math.min(60, cameraAngleRef.current.radius + event.deltaY * 0.03)
      );
      updateCameraPosition();
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('click', handleClick);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Updates camera spherical coordinates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y + 6, z);
    cameraRef.current.lookAt(0, 6, 0);
  };

  // Re-build or update 3D mesh colors when roomsAvailability changes
  useEffect(() => {
    roomsAvailability.forEach((info) => {
      const mesh = roomMeshesRef.current.get(info.room.id);
      if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        let colorHex = 0x10b981; // FREE: Emerald green
        if (!info.isFree) {
          colorHex = 0xef4444; // OCCUPIED: Crimson red
        } else if (info.status === 'ENDING_SOON') {
          colorHex = 0xf59e0b; // ENDING SOON: Amber
        }

        // Highlight if currently selected in modal
        if (selectedRoomId === info.room.id) {
          colorHex = 0x6366f1; // Indigo highlight
          mesh.material.emissive.setHex(0x312e81);
        } else {
          mesh.material.emissive.setHex(0x000000);
        }

        mesh.material.color.setHex(colorHex);

        // Floor isolation opacity
        if (activeFloorFilter !== 'all' && info.room.floor !== activeFloorFilter) {
          mesh.visible = false;
        } else {
          mesh.visible = true;
        }
      }
    });
  }, [roomsAvailability, activeFloorFilter, selectedRoomId]);

  // Construct 3D building structure
  const buildBuildingGeometry = (scene: THREE.Scene) => {
    const floorHeight = 2.4;

    BUILDING_FLOORS.forEach((floor) => {
      const yPos = floor.floor * floorHeight;

      // Floor slab
      const slabGeo = new THREE.BoxGeometry(22, 0.2, 14);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, yPos - 0.1, 0);
      slab.receiveShadow = true;
      scene.add(slab);

      // Floor label columns
      const colGeo = new THREE.CylinderGeometry(0.2, 0.2, floorHeight, 8);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const col1 = new THREE.Mesh(colGeo, colMat);
      col1.position.set(-10, yPos + floorHeight / 2, -6);
      scene.add(col1);

      const col2 = new THREE.Mesh(colGeo, colMat);
      col2.position.set(10, yPos + floorHeight / 2, -6);
      scene.add(col2);
    });

    // Populate room boxes from roomsAvailability
    roomsAvailability.forEach((info) => {
      const room = info.room;
      const coords = room.gridCoordinates || { x: 0, z: 0, width: 3.5, depth: 3.5 };
      const yPos = room.floor * floorHeight + 0.8;

      const roomGeo = new THREE.BoxGeometry(coords.width, 1.4, coords.depth);
      const roomMat = new THREE.MeshStandardMaterial({
        color: info.isFree ? 0x10b981 : 0xef4444,
        roughness: 0.3,
        metalness: 0.1,
      });

      const roomMesh = new THREE.Mesh(roomGeo, roomMat);
      roomMesh.position.set(coords.x, yPos, coords.z);
      roomMesh.castShadow = true;
      roomMesh.receiveShadow = true;
      roomMesh.userData = { roomId: room.id };

      scene.add(roomMesh);
      roomMeshesRef.current.set(room.id, roomMesh);
    });
  };

  const handleResetCamera = () => {
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 36 };
    updateCameraPosition();
  };

  return (
    <div className="relative rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
      {/* 3D Viewport Header & Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
        <div className="p-3 px-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-bold text-white tracking-wide">
              3D Campus Building Navigator (IST Block)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Drag to rotate · Scroll to zoom · Click room to view & claim
          </p>
        </div>

        {/* Floor Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 pointer-events-auto shadow-lg overflow-x-auto">
          <button
            onClick={() => setActiveFloorFilter('all')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
              activeFloorFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Floors
          </button>
          {BUILDING_FLOORS.map((f) => (
            <button
              key={f.floor}
              onClick={() => setActiveFloorFilter(f.floor)}
              className={`px-2 py-1 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                activeFloorFilter === f.floor
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f.shortName}
            </button>
          ))}
          <button
            onClick={handleResetCamera}
            title="Reset Camera View"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-1 border-l border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-[520px] sm:h-[600px] cursor-grab active:cursor-grabbing" />

      {/* Hover Tooltip Overlay */}
      {hoveredRoom && (
        <div
          className="absolute z-20 pointer-events-none p-3 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-800 shadow-2xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-3 animate-fade-in"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="flex items-center justify-between gap-3">
            <strong className="text-white text-sm">{hoveredRoom.room.roomNumber}</strong>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                hoveredRoom.isFree
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {hoveredRoom.isFree ? 'FREE' : 'OCCUPIED'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {hoveredRoom.room.floorName} · {hoveredRoom.room.capacity} Seats
          </div>
          <div className="text-[11px] font-mono pt-1 border-t border-slate-800">
            {hoveredRoom.isFree ? (
              <span className="text-emerald-300">
                Available until {hoveredRoom.availableUntil}
              </span>
            ) : (
              <span className="text-rose-300">
                Class: {hoveredRoom.currentClass?.subjectName || 'In progress'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend & Camera Helper Footer */}
      <div className="p-3.5 px-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <strong className="text-slate-200">🟢 FREE</strong> (Available Now)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#ef4444]" />
            <strong className="text-slate-200">🔴 OCCUPIED</strong> (Class Ongoing)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <strong className="text-slate-200">🟡 ENDING SOON</strong> (&lt;15m)
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time Timetable Synced</span>
        </div>
      </div>
    </div>
  );
};
