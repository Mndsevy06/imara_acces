export type UserRole = 'ADMIN' | 'AGENT' | 'MEMBER';
export type ScanSource = 'PHONE' | 'BOITIER';

export interface AgentData {
  id: string;
  portail: string;
  status: 'ACTIVE' | 'OFFLINE';
  shiftStart: string;
  shiftEnd: string;
  readerId?: string | null;
  configurationId?: string | null;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  code?: string;
  licensePlate?: string;
  avatar?: string;
  agent?: AgentData | null;
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
  readerCount?: number;
  creatorId?: string;
}

export interface CardReader {
  id: string;
  label: string;
  type: 'NFC' | 'RFID' | 'BOTH';
  location: string;
  configurationId?: string | null;
}

export interface Agent {
  id: string;
  userId: string;
  portail: string;
  status: 'ACTIVE' | 'OFFLINE';
  shiftStart: string;
  shiftEnd: string;
  readerId?: string;
  user?: User;
  reader?: CardReader;
}
