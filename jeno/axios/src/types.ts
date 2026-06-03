export type UserRole = 'ADMIN' | 'AGENT' | 'MEMBER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  code?: string;
  licensePlate?: string;
  avatar?: string;
}

export interface ParkingZone {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  type: 'PROFESSOR' | 'STUDENT' | 'VISITOR' | 'STAFF' | 'CHURCH';
}

export interface MapTile {
  type: 'ROAD' | 'BUILDING' | 'PARKING' | 'GATE' | 'EMPTY';
  direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  parkingId?: string;
}

export interface Configuration {
  id: string;
  name: string;
  description: string;
  status: 'LOCKED' | 'EDITABLE';
  createdAt: string;
  agentCount: number;
  parkingCount: number;
}
