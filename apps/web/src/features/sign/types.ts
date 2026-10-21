export type SignatureMode = 'draw' | 'type' | 'upload';

export interface SavedSignature {
  id: string;
  name: string;
  dataUrl: string;
  type: SignatureMode;
  createdAt: number;
}

export interface PlacedSignature {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  includeDateStamp?: boolean;
  dateStampText?: string;
}
