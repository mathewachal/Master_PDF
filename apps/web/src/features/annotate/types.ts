/**
 * Annotation & Markup Type Definitions
 */

export type AnnotationTool =
  | 'select'
  | 'pen'
  | 'highlight'
  | 'underline'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'note'
  | 'stamp'
  | 'measure';

export type StampType =
  | 'APPROVED'
  | 'CONFIDENTIAL'
  | 'DRAFT'
  | 'FINAL'
  | 'REJECTED'
  | 'VOID';

export interface BaseAnnotation {
  id: string;
  pageNumber: number;
  createdAt: number;
  color: string;
  opacity: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingAnnotation extends BaseAnnotation {
  type: 'pen' | 'highlight';
  points: DrawingPoint[];
  strokeWidth: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'circle' | 'arrow' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
  fillColor?: string;
}

export interface NoteComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface NoteAnnotation extends BaseAnnotation {
  type: 'note';
  x: number;
  y: number;
  title: string;
  comments: NoteComment[];
}

export interface StampAnnotation extends BaseAnnotation {
  type: 'stamp';
  x: number;
  y: number;
  width: number;
  height: number;
  stampType: StampType;
}

export interface MeasurementAnnotation extends BaseAnnotation {
  type: 'measure';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  scaleRatio: number; // e.g. 1 point = 1 mm
  unit: 'mm' | 'cm' | 'in' | 'ft';
}

export type Annotation =
  | DrawingAnnotation
  | ShapeAnnotation
  | NoteAnnotation
  | StampAnnotation
  | MeasurementAnnotation;
