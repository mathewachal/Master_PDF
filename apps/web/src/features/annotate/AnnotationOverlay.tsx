import React, { useState, useRef } from 'react';
import {
  DrawingPoint,
  DrawingAnnotation,
  ShapeAnnotation,
  NoteAnnotation,
  StampAnnotation,
  MeasurementAnnotation,
} from './types';
import { useAnnotationStore } from './annotationStore';

export const AnnotationOverlay: React.FC<{
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}> = ({ pageNumber, width, height, scale }) => {
  const {
    annotations,
    activeTool,
    selectedAnnotationId,
    setSelectedAnnotationId,
    strokeColor,
    strokeWidth,
    opacity,
    fillColor,
    activeStampType,
    addAnnotation,
    deleteAnnotation,
  } = useAnnotationStore();

  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const [dragStart, setDragStart] = useState<DrawingPoint | null>(null);
  const [dragCurrent, setDragCurrent] = useState<DrawingPoint | null>(null);
  const [activeNoteText, setActiveNoteText] = useState('');
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const getRelativeCoords = (e: React.PointerEvent<SVGSVGElement>): DrawingPoint => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'select') return;
    (e.target as Element).setPointerCapture(e.pointerId);

    const pt = getRelativeCoords(e);
    setDragStart(pt);
    setDragCurrent(pt);

    if (activeTool === 'pen' || activeTool === 'highlight') {
      setCurrentPath([pt]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStart) return;
    const pt = getRelativeCoords(e);
    setDragCurrent(pt);

    if (activeTool === 'pen' || activeTool === 'highlight') {
      setCurrentPath((prev) => [...prev, pt]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStart || !dragCurrent) {
      setDragStart(null);
      setDragCurrent(null);
      setCurrentPath([]);
      return;
    }

    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (_) {
      // Ignore if not captured
    }

    const now = Date.now();
    const id = `ann-${now}-${Math.random().toString(36).substr(2, 6)}`;

    if ((activeTool === 'pen' || activeTool === 'highlight') && currentPath.length > 1) {
      const isHighlighter = activeTool === 'highlight';
      const newAnn: DrawingAnnotation = {
        id,
        pageNumber,
        type: activeTool,
        points: currentPath,
        color: isHighlighter ? '#facc15' : strokeColor,
        strokeWidth: isHighlighter ? strokeWidth * 4 : strokeWidth,
        opacity: isHighlighter ? 0.35 : opacity,
        createdAt: now,
      };
      addAnnotation(newAnn);
    } else if (
      activeTool === 'rectangle' ||
      activeTool === 'circle' ||
      activeTool === 'arrow' ||
      activeTool === 'line'
    ) {
      const minX = Math.min(dragStart.x, dragCurrent.x);
      const minY = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.max(10, Math.abs(dragCurrent.x - dragStart.x));
      const h = Math.max(10, Math.abs(dragCurrent.y - dragStart.y));

      const newAnn: ShapeAnnotation = {
        id,
        pageNumber,
        type: activeTool,
        x: minX,
        y: minY,
        width: w,
        height: h,
        color: strokeColor,
        strokeWidth,
        fillColor: fillColor !== 'transparent' ? fillColor : undefined,
        opacity,
        createdAt: now,
      };
      addAnnotation(newAnn);
    } else if (activeTool === 'note') {
      const newAnn: NoteAnnotation = {
        id,
        pageNumber,
        type: 'note',
        x: dragStart.x,
        y: dragStart.y,
        title: 'Sticky Note',
        comments: [
          {
            id: `c-${now}`,
            author: 'Reviewer',
            text: 'Add review note...',
            createdAt: now,
          },
        ],
        color: '#f59e0b',
        opacity: 1.0,
        createdAt: now,
      };
      addAnnotation(newAnn);
      setOpenNoteId(id);
    } else if (activeTool === 'stamp') {
      const newAnn: StampAnnotation = {
        id,
        pageNumber,
        type: 'stamp',
        x: dragStart.x - 60,
        y: dragStart.y - 20,
        width: 140,
        height: 44,
        stampType: activeStampType,
        color: activeStampType === 'APPROVED' ? '#10b981' : '#ef4444',
        opacity: 0.9,
        createdAt: now,
      };
      addAnnotation(newAnn);
    } else if (activeTool === 'measure') {
      const newAnn: MeasurementAnnotation = {
        id,
        pageNumber,
        type: 'measure',
        x1: dragStart.x,
        y1: dragStart.y,
        x2: dragCurrent.x,
        y2: dragCurrent.y,
        scaleRatio: 0.352778, // 1 pt approx 0.3528 mm
        unit: 'mm',
        color: '#2563eb',
        opacity: 1.0,
        createdAt: now,
      };
      addAnnotation(newAnn);
    }

    setDragStart(null);
    setDragCurrent(null);
    setCurrentPath([]);
  };

  // Filter annotations belonging to this specific page
  const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNumber);

  return (
    <div
      className="absolute inset-0 pointer-events-auto"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full select-none ${
          activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        <g transform={`scale(${scale})`}>
          {/* Render Existing Page Annotations */}
          {pageAnnotations.map((ann) => {
            const isSelected = selectedAnnotationId === ann.id;

            if (ann.type === 'pen' || ann.type === 'highlight') {
              const pathStr = ann.points
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                .join(' ');

              return (
                <path
                  key={ann.id}
                  d={pathStr}
                  fill="none"
                  stroke={ann.color}
                  strokeWidth={ann.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={ann.opacity}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(ann.id);
                  }}
                  className={`transition-opacity ${
                    isSelected ? 'stroke-brand-500 filter drop-shadow-md' : ''
                  }`}
                />
              );
            }

            if (ann.type === 'rectangle') {
              return (
                <rect
                  key={ann.id}
                  x={ann.x}
                  y={ann.y}
                  width={ann.width}
                  height={ann.height}
                  fill={ann.fillColor || 'transparent'}
                  stroke={ann.color}
                  strokeWidth={ann.strokeWidth}
                  opacity={ann.opacity}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(ann.id);
                  }}
                  className={isSelected ? 'stroke-brand-500 stroke-dasharray-2' : ''}
                />
              );
            }

            if (ann.type === 'circle') {
              return (
                <ellipse
                  key={ann.id}
                  cx={ann.x + ann.width / 2}
                  cy={ann.y + ann.height / 2}
                  rx={ann.width / 2}
                  ry={ann.height / 2}
                  fill={ann.fillColor || 'transparent'}
                  stroke={ann.color}
                  strokeWidth={ann.strokeWidth}
                  opacity={ann.opacity}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(ann.id);
                  }}
                />
              );
            }

            if (ann.type === 'line' || ann.type === 'arrow') {
              return (
                <g key={ann.id}>
                  <line
                    x1={ann.x}
                    y1={ann.y}
                    x2={ann.x + ann.width}
                    y2={ann.y + ann.height}
                    stroke={ann.color}
                    strokeWidth={ann.strokeWidth}
                    opacity={ann.opacity}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnotationId(ann.id);
                    }}
                  />
                  {ann.type === 'arrow' && (
                    <circle
                      cx={ann.x + ann.width}
                      cy={ann.y + ann.height}
                      r={ann.strokeWidth * 2}
                      fill={ann.color}
                    />
                  )}
                </g>
              );
            }

            if (ann.type === 'stamp') {
              return (
                <g
                  key={ann.id}
                  transform={`translate(${ann.x}, ${ann.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(ann.id);
                  }}
                  className="cursor-pointer"
                >
                  <rect
                    width={ann.width}
                    height={ann.height}
                    rx="6"
                    fill="white"
                    stroke={ann.color}
                    strokeWidth="3"
                    strokeDasharray="4 2"
                    opacity={ann.opacity}
                  />
                  <text
                    x={ann.width / 2}
                    y={ann.height / 2 + 5}
                    textAnchor="middle"
                    fill={ann.color}
                    fontSize="16"
                    fontWeight="800"
                    fontFamily="monospace"
                    letterSpacing="2"
                  >
                    {ann.stampType}
                  </text>
                </g>
              );
            }

            if (ann.type === 'note') {
              return (
                <g
                  key={ann.id}
                  transform={`translate(${ann.x}, ${ann.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenNoteId(ann.id);
                    setSelectedAnnotationId(ann.id);
                  }}
                  className="cursor-pointer"
                >
                  <circle r="14" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                  <text
                    textAnchor="middle"
                    y="5"
                    fill="#78350f"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    ✎
                  </text>
                </g>
              );
            }

            if (ann.type === 'measure') {
              const dx = ann.x2 - ann.x1;
              const dy = ann.y2 - ann.y1;
              const distPts = Math.sqrt(dx * dx + dy * dy);
              const measurement = (distPts * ann.scaleRatio).toFixed(1);
              const midX = (ann.x1 + ann.x2) / 2;
              const midY = (ann.y1 + ann.y2) / 2;

              return (
                <g key={ann.id}>
                  <line
                    x1={ann.x1}
                    y1={ann.y1}
                    x2={ann.x2}
                    y2={ann.y2}
                    stroke={ann.color}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                  <circle cx={ann.x1} cy={ann.y1} r="3" fill={ann.color} />
                  <circle cx={ann.x2} cy={ann.y2} r="3" fill={ann.color} />
                  <rect
                    x={midX - 28}
                    y={midY - 10}
                    width="56"
                    height="18"
                    rx="4"
                    fill="white"
                    stroke={ann.color}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={ann.color}
                  >
                    {measurement} {ann.unit}
                  </text>
                </g>
              );
            }

            return null;
          })}

          {/* Active Freehand Drag Preview */}
          {currentPath.length > 1 && (
            <path
              d={currentPath
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                .join(' ')}
              fill="none"
              stroke={activeTool === 'highlight' ? '#facc15' : strokeColor}
              strokeWidth={activeTool === 'highlight' ? strokeWidth * 4 : strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={activeTool === 'highlight' ? 0.35 : opacity}
            />
          )}

          {/* Active Shape Rubberband Preview */}
          {dragStart && dragCurrent && activeTool === 'rectangle' && (
            <rect
              x={Math.min(dragStart.x, dragCurrent.x)}
              y={Math.min(dragStart.y, dragCurrent.y)}
              width={Math.abs(dragCurrent.x - dragStart.x)}
              height={Math.abs(dragCurrent.y - dragStart.y)}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="4 2"
            />
          )}
        </g>
      </svg>

      {/* Sticky Note Popover Card */}
      {openNoteId && (
        <div className="absolute top-10 left-10 z-30 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-xl p-3 shadow-xl w-60 text-xs">
          <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800/60 pb-1 mb-2">
            <span>Sticky Note</span>
            <button
              onClick={() => setOpenNoteId(null)}
              className="text-amber-700 hover:text-amber-900"
            >
              ✕
            </button>
          </div>
          <textarea
            rows={3}
            value={activeNoteText}
            onChange={(e) => setActiveNoteText(e.target.value)}
            placeholder="Type note or comment..."
            className="w-full p-1.5 text-xs rounded bg-white dark:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex items-center justify-between mt-2 pt-1">
            <button
              onClick={() => {
                deleteAnnotation(openNoteId);
                setOpenNoteId(null);
              }}
              className="text-red-600 hover:underline text-[11px]"
            >
              Delete Note
            </button>
            <button
              onClick={() => setOpenNoteId(null)}
              className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
