import { Room, RoomClassScheduleEntry, DayOfWeek } from '../types';
import { SECTIONS_DATA } from './timetableData';

export const PERIOD_SLOTS = [
  { period: 1, startTime: '09:00', endTime: '09:50', label: '09:00 - 09:50' },
  { period: 2, startTime: '09:55', endTime: '10:45', label: '09:55 - 10:45' },
  { period: 3, startTime: '10:50', endTime: '11:40', label: '10:50 - 11:40' },
  { period: 4, startTime: '11:45', endTime: '12:35', label: '11:45 - 12:35' },
  { period: 5, startTime: '12:35', endTime: '13:30', label: '12:35 - 01:30' },
  { period: 6, startTime: '13:30', endTime: '14:20', label: '01:30 - 02:20' },
  { period: 7, startTime: '14:25', endTime: '15:15', label: '02:25 - 03:15' },
  { period: 8, startTime: '15:20', endTime: '16:10', label: '03:20 - 04:10' },
  { period: 9, startTime: '16:15', endTime: '17:05', label: '04:15 - 05:05' },
];

export const BUILDING_FLOORS = [
  { floor: 0, name: 'Ground Floor', shortName: 'GF' },
  { floor: 1, name: '1st Floor', shortName: '1F' },
  { floor: 2, name: '2nd Floor', shortName: '2F' },
  { floor: 3, name: '3rd Floor', shortName: '3F' },
  { floor: 4, name: '4th Floor', shortName: '4F' },
  { floor: 5, name: '5th Floor', shortName: '5F' },
  { floor: 6, name: '6th Floor', shortName: '6F' },
  { floor: 7, name: '7th Floor', shortName: '7F' },
];

export const ROOMS_METADATA: Room[] = [
  // Ground Floor (Floor 0)
  {
    id: 'tb-106',
    roomNumber: 'TB-106',
    name: 'Tutorial Block 106',
    floor: 0,
    floorName: 'Ground Floor',
    isAc: false,
    capacity: 55,
    type: 'Classroom',
    facilities: ['Projector', 'Power Outlets', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -6, z: -4, width: 4, depth: 3.5 },
  },
  {
    id: 'che-lab',
    roomNumber: 'Che Lab',
    name: 'Chemistry Laboratory',
    floor: 0,
    floorName: 'Ground Floor',
    isAc: true,
    capacity: 45,
    type: 'Laboratory',
    facilities: ['AC', 'Lab Workstations', 'Safety Stations', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 0, z: -4, width: 5, depth: 3.5 },
  },
  {
    id: 'workshop-ist',
    roomNumber: 'Workshop (IST 20,21)',
    name: 'IST Engineering Workshop',
    floor: 0,
    floorName: 'Ground Floor',
    isAc: false,
    capacity: 65,
    type: 'Workshop',
    facilities: ['Machinery Benches', 'Power Outlets', 'Ventilation'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 6, z: -4, width: 5.5, depth: 3.5 },
  },

  // 1st Floor (Floor 1)
  {
    id: 'ist-105',
    roomNumber: 'IST 105',
    name: 'Lecture Hall 105',
    floor: 1,
    floorName: '1st Floor',
    isAc: true,
    capacity: 65,
    type: 'Classroom',
    facilities: ['AC', 'Smart Board', 'Audio System', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -6, z: -4, width: 4, depth: 3.5 },
  },
  {
    id: 'ist-107',
    roomNumber: 'IST 107',
    name: 'Microprocessor Lab 107',
    floor: 1,
    floorName: '1st Floor',
    isAc: true,
    capacity: 50,
    type: 'Laboratory',
    facilities: ['AC', 'Microcontroller Kits', 'Computers', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 0, z: -4, width: 4.5, depth: 3.5 },
  },
  {
    id: 'ist-108',
    roomNumber: 'IST 108',
    name: 'PCB & Hardware Lab 108',
    floor: 1,
    floorName: '1st Floor',
    isAc: true,
    capacity: 50,
    type: 'Laboratory',
    facilities: ['AC', 'Soldering Stations', 'Oscilloscopes', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 6, z: -4, width: 4.5, depth: 3.5 },
  },

  // 2nd Floor (Floor 2)
  {
    id: 'ist-201',
    roomNumber: 'IST 201',
    name: 'Lecture Hall 201',
    floor: 2,
    floorName: '2nd Floor',
    isAc: true,
    capacity: 70,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Power Outlets', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -6.5, z: -4, width: 4, depth: 3.5 },
  },
  {
    id: 'ist-211',
    roomNumber: 'IST 211',
    name: 'Lecture Hall 211',
    floor: 2,
    floorName: '2nd Floor',
    isAc: true,
    capacity: 65,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -2, z: -4, width: 4, depth: 3.5 },
  },
  {
    id: 'ist-225',
    roomNumber: 'IST 225',
    name: 'Smart Classroom 225',
    floor: 2,
    floorName: '2nd Floor',
    isAc: true,
    capacity: 60,
    type: 'Classroom',
    facilities: ['AC', 'Smart Display', 'Dual Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 2.5, z: -4, width: 4, depth: 3.5 },
  },
  {
    id: 'ist-227',
    roomNumber: 'IST 227',
    name: 'Seminar Room 227',
    floor: 2,
    floorName: '2nd Floor',
    isAc: true,
    capacity: 60,
    type: 'Seminar Hall',
    facilities: ['AC', 'Audio System', 'Podium Mic', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 7, z: -4, width: 4, depth: 3.5 },
  },

  // 3rd Floor (Floor 3)
  {
    id: 'lab-309',
    roomNumber: 'LAB-309',
    name: 'DSP & VLSI Computing Lab',
    floor: 3,
    floorName: '3rd Floor',
    isAc: true,
    capacity: 55,
    type: 'Laboratory',
    facilities: ['AC', 'Workstation PCs', 'EDA Tools', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -5, z: -4, width: 5, depth: 3.5 },
  },
  {
    id: 'ist-315',
    roomNumber: 'IST 315',
    name: 'Classroom 315',
    floor: 3,
    floorName: '3rd Floor',
    isAc: true,
    capacity: 60,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 1, z: -4, width: 4, depth: 3.5 },
  },
  {
    id: 'ist-320',
    roomNumber: 'IST 320',
    name: 'Lecture Hall 320',
    floor: 3,
    floorName: '3rd Floor',
    isAc: false,
    capacity: 65,
    type: 'Classroom',
    facilities: ['Projector', 'Ceiling Fans', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 6, z: -4, width: 4, depth: 3.5 },
  },

  // 4th Floor (Floor 4)
  {
    id: 'g-401',
    roomNumber: 'G-401',
    name: 'Gallery Hall 401',
    floor: 4,
    floorName: '4th Floor',
    isAc: true,
    capacity: 120,
    type: 'Gallery Hall',
    facilities: ['AC', 'Tiered Seating', 'Surround Audio', 'Dual Projectors', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -4, z: -4, width: 6.5, depth: 4 },
  },
  {
    id: 'ist-411',
    roomNumber: 'IST 411',
    name: 'Lecture Hall 411',
    floor: 4,
    floorName: '4th Floor',
    isAc: true,
    capacity: 70,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Audio System', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 4, z: -4, width: 5, depth: 3.5 },
  },

  // 5th Floor (Floor 5)
  {
    id: 'ist-502',
    roomNumber: 'IST 502',
    name: 'Lecture Hall 502',
    floor: 5,
    floorName: '5th Floor',
    isAc: true,
    capacity: 65,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -8, z: -4, width: 3.5, depth: 3.5 },
  },
  {
    id: 'ist-508',
    roomNumber: 'IST 508',
    name: 'Lecture Hall 508',
    floor: 5,
    floorName: '5th Floor',
    isAc: true,
    capacity: 65,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Audio System', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -4, z: -4, width: 3.5, depth: 3.5 },
  },
  {
    id: 'ist-509',
    roomNumber: 'IST 509',
    name: 'Smart Classroom 509',
    floor: 5,
    floorName: '5th Floor',
    isAc: true,
    capacity: 55,
    type: 'Classroom',
    facilities: ['AC', 'Smart Display', 'Power Outlets', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 0, z: -4, width: 3.5, depth: 3.5 },
  },
  {
    id: 'ist-510',
    roomNumber: 'IST 510',
    name: 'Lecture Hall 510',
    floor: 5,
    floorName: '5th Floor',
    isAc: true,
    capacity: 65,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 4, z: -4, width: 3.5, depth: 3.5 },
  },
  {
    id: 'ist-518',
    roomNumber: 'IST 518',
    name: 'Lecture Hall 518',
    floor: 5,
    floorName: '5th Floor',
    isAc: true,
    capacity: 70,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Audio System', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 8, z: -4, width: 3.5, depth: 3.5 },
  },
  {
    id: 'ist-519',
    roomNumber: 'IST 519',
    name: 'Lecture Hall 519',
    floor: 5,
    floorName: '5th Floor',
    isAc: true,
    capacity: 70,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -4, z: 2, width: 3.5, depth: 3.5 },
  },
  {
    id: 'ist-520',
    roomNumber: 'IST 520',
    name: 'Lecture Hall 520',
    floor: 5,
    floorName: '5th Floor',
    isAc: true,
    capacity: 65,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 2, z: 2, width: 3.5, depth: 3.5 },
  },

  // 6th Floor (Floor 6)
  {
    id: 'g-602',
    roomNumber: 'G-602',
    name: 'Gallery Hall 602 / IST 602',
    floor: 6,
    floorName: '6th Floor',
    isAc: true,
    capacity: 120,
    type: 'Gallery Hall',
    facilities: ['AC', 'Tiered Amphitheater', 'Dual Projectors', 'Surround Sound', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -6, z: -4, width: 6, depth: 4 },
  },
  {
    id: 'ist-609',
    roomNumber: 'IST 609',
    name: 'Classroom 609',
    floor: 6,
    floorName: '6th Floor',
    isAc: true,
    capacity: 60,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 2, z: -4, width: 4, depth: 3.5 },
  },
  {
    id: 'ist-617',
    roomNumber: 'IST 617',
    name: 'Smart Classroom 617',
    floor: 6,
    floorName: '6th Floor',
    isAc: true,
    capacity: 55,
    type: 'Classroom',
    facilities: ['AC', 'Smart Screen', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 7, z: -4, width: 4, depth: 3.5 },
  },
  {
    id: 'pps-lab-618',
    roomNumber: 'PPS Lab (IST 618)',
    name: 'Programming & Problem Solving Lab',
    floor: 6,
    floorName: '6th Floor',
    isAc: true,
    capacity: 55,
    type: 'Laboratory',
    facilities: ['AC', 'High-Spec PCs', 'Gigabit LAN', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -6, z: 2, width: 5, depth: 3.5 },
  },
  {
    id: 'cdc-625',
    roomNumber: 'CDC-625',
    name: 'CDC Seminar Gallery (G-625)',
    floor: 6,
    floorName: '6th Floor',
    isAc: true,
    capacity: 100,
    type: 'Gallery Hall',
    facilities: ['AC', 'Corporate Presentation Rig', 'Microphones', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 2, z: 2, width: 6, depth: 3.5 },
  },
  {
    id: 'ist-626',
    roomNumber: 'IST 626',
    name: 'Classroom 626',
    floor: 6,
    floorName: '6th Floor',
    isAc: false,
    capacity: 65,
    type: 'Classroom',
    facilities: ['Projector', 'High Ceilings', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 9, z: 2, width: 3.5, depth: 3.5 },
  },

  // 7th Floor (Floor 7)
  {
    id: 'ist-702',
    roomNumber: 'IST 702',
    name: 'Lecture Hall 702',
    floor: 7,
    floorName: '7th Floor',
    isAc: true,
    capacity: 65,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: -5, z: -4, width: 4.5, depth: 3.5 },
  },
  {
    id: 'ist-710',
    roomNumber: 'IST 710',
    name: 'Lecture Hall 710',
    floor: 7,
    floorName: '7th Floor',
    isAc: true,
    capacity: 70,
    type: 'Classroom',
    facilities: ['AC', 'Projector', 'Scenic View', 'Wi-Fi'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 1, z: -4, width: 4.5, depth: 3.5 },
  },
  {
    id: 'yoga-hall',
    roomNumber: 'Yoga Hall',
    name: 'Yoga & Activity Hall (IST 720)',
    floor: 7,
    floorName: '7th Floor',
    isAc: false,
    capacity: 80,
    type: 'Seminar Hall',
    facilities: ['Wooden Flooring', 'Audio System', 'Open Space', 'Ventilation'],
    building: 'IST Academic Block',
    gridCoordinates: { x: 7, z: -4, width: 5.5, depth: 3.5 },
  },
];

/**
 * Normalizes room name strings from timetables to match standard room IDs.
 */
export function normalizeRoomId(rawRoomStr: string): string | null {
  if (!rawRoomStr) return null;
  const clean = rawRoomStr.trim().toUpperCase();

  if (clean.includes('TB-106') || clean.includes('H-TB-106')) return 'tb-106';
  if (clean.includes('CHE LAB')) return 'che-lab';
  if (clean.includes('WORKSHOP')) return 'workshop-ist';

  if (clean.includes('105')) return 'ist-105';
  if (clean.includes('107') || clean.includes('MPMC')) return 'ist-107';
  if (clean.includes('108') || clean.includes('PCB LAB')) return 'ist-108';

  if (clean.includes('201')) return 'ist-201';
  if (clean.includes('211')) return 'ist-211';
  if (clean.includes('225')) return 'ist-225';
  if (clean.includes('227')) return 'ist-227';

  if (clean.includes('309') || clean.includes('LAB-309')) return 'lab-309';
  if (clean.includes('315')) return 'ist-315';
  if (clean.includes('320')) return 'ist-320';

  if (clean.includes('401') || clean.includes('G-401')) return 'g-401';
  if (clean.includes('411')) return 'ist-411';
  if (clean.includes('418')) return 'ist-418';

  if (clean.includes('502')) return 'ist-502';
  if (clean.includes('508')) return 'ist-508';
  if (clean.includes('509')) return 'ist-509';
  if (clean.includes('510')) return 'ist-510';
  if (clean.includes('518')) return 'ist-518';
  if (clean.includes('519')) return 'ist-519';
  if (clean.includes('520')) return 'ist-520';

  if (clean.includes('602') || clean.includes('G-602')) return 'g-602';
  if (clean.includes('609')) return 'ist-609';
  if (clean.includes('617')) return 'ist-617';
  if (clean.includes('618') || clean.includes('PPS LAB')) return 'pps-lab-618';
  if (clean.includes('625') || clean.includes('CDC') || clean.includes('G-625')) return 'cdc-625';
  if (clean.includes('626')) return 'ist-626';

  if (clean.includes('702')) return 'ist-702';
  if (clean.includes('710')) return 'ist-710';
  if (clean.includes('YOGA')) return 'yoga-hall';

  return null;
}

/**
 * Builds the Master Schedule of all Room Occupancies across all sections in the dataset.
 */
export function buildMasterRoomOccupancySchedule(): Map<string, RoomClassScheduleEntry[]> {
  const roomScheduleMap = new Map<string, RoomClassScheduleEntry[]>();

  // Initialize entry lists for all rooms
  ROOMS_METADATA.forEach((room) => {
    roomScheduleMap.set(room.id, []);
  });

  // Parse every section timetable
  SECTIONS_DATA.forEach((sec) => {
    sec.schedule.forEach((daySchedule) => {
      daySchedule.slots.forEach((slot) => {
        const rawRoom = slot.room || sec.venue || '';
        const roomId = normalizeRoomId(rawRoom);
        if (roomId && roomScheduleMap.has(roomId)) {
          const timing = PERIOD_SLOTS.find((p) => p.period === slot.period);
          if (timing) {
            const entry: RoomClassScheduleEntry = {
              day: daySchedule.day,
              period: slot.period,
              startTime: timing.startTime,
              endTime: timing.endTime,
              subjectCode: slot.subjectCode,
              subjectName: slot.subjectName,
              sectionName: sec.name,
              faculty: slot.faculty,
            };

            // Avoid duplicate registrations
            const existing = roomScheduleMap.get(roomId)!;
            const duplicate = existing.some(
              (e) => e.day === entry.day && e.period === entry.period
            );
            if (!duplicate) {
              existing.push(entry);
            }
          }
        }
      });
    });
  });

  return roomScheduleMap;
}

// Pre-compiled master room occupancy schedule
export const MASTER_ROOM_OCCUPANCY_SCHEDULE = buildMasterRoomOccupancySchedule();
