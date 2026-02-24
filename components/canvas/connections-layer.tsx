"use client";

import React from "react";
import { ConnectionType } from "@/types/project";
import { DEVICE_PRESETS } from "@/constant/devices";

// Default frame dimensions - using the iPhone 15 Pro preset as baseline
const FRAME_WIDTH = DEVICE_PRESETS["iphone-15-pro"].width;
const FRAME_HEIGHT = DEVICE_PRESETS["iphone-15-pro"].height;

interface Props {
  connections: ConnectionType[];
  framePositions: Record<string, { x: number; y: number }>;
  activeConnection?: { fromId: string, x: number, y: number } | null;
  hoveredFrameId?: string | null;
  mousePos?: { x: number, y: number };
  scale: number;
  onDeleteConnection?: (id: string) => void;
}

export const ConnectionsLayer = ({ 
  connections, 
  framePositions, 
  activeConnection, 
  hoveredFrameId,
  mousePos,
  scale,
  onDeleteConnection,
}: Props) => {
  return (
    <svg 
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ 
        zIndex: 5,
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "visible",
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="12"
          markerHeight="9"
          refX="11"
          refY="4.5"
          orient="auto"
        >
          <path d="M 0 0 L 12 4.5 L 0 9 Z" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-draft"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <path d="M 0 0 L 10 3.5 L 0 7 Z" fill="#60a5fa" opacity="0.8" />
        </marker>
        <filter id="glow-strong" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Existing connections */}
      {connections.map((conn) => {
        const fromPos = framePositions[conn.fromId];
        const toPos = framePositions[conn.toId];
        
        if (!fromPos || !toPos) return null;

        // Calculate dynamic anchors
        const fromX = fromPos.x + FRAME_WIDTH;
        const fromY = fromPos.y + FRAME_HEIGHT / 2;
        const toX = toPos.x;
        const toY = toPos.y + FRAME_HEIGHT / 2;

        const deltaX = toX - fromX;
        const deltaY = toY - fromY;
        
        // Dynamic control point offset based on distance
        const controlOffset = Math.min(Math.max(100, Math.abs(deltaX) * 0.6), 300);
        
        const pathData = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;

        return (
          <g key={conn.id} className="group/conn pointer-events-auto cursor-pointer">
            {/* Wider collision area for easier interaction */}
            <path
              d={pathData}
              stroke="transparent"
              strokeWidth="20"
              fill="none"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConnection?.(conn.id);
              }}
            />
            {/* Background glow */}
            <path
              d={pathData}
              stroke="#3b82f6"
              strokeWidth="4"
              fill="none"
              strokeOpacity="0.1"
              className="group-hover/conn:stroke-opacity-30 transition-all duration-300"
            />
            <path
              d={pathData}
              stroke="#3b82f6"
              strokeWidth="2.5"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="transition-all duration-300 group-hover/conn:stroke-blue-400 group-hover/conn:stroke-[3.5px]"
            />
            
            {conn.label && (
              <g 
                className="group/label"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConnection?.(conn.id);
                }}
              >
                <rect
                  x={(fromX + toX) / 2 - 40}
                  y={(fromY + toY) / 2 - 14}
                  width="80"
                  height="28"
                  rx="14"
                  fill="#18181b"
                  className="shadow-xl transition-all group-hover/label:fill-red-500 group-hover/label:scale-110"
                  style={{ transformOrigin: "center" }}
                />
                <text
                  x={(fromX + toX) / 2 - 6}
                  y={(fromY + toY) / 2 + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {conn.label}
                </text>
                <text
                  x={(fromX + toX) / 2 + 25}
                  y={(fromY + toY) / 2 + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="800"
                  className="opacity-50 group-hover/label:opacity-100 transition-opacity pointer-events-none select-none"
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}

      {activeConnection && mousePos && (
        (() => {
          const fromPos = framePositions[activeConnection.fromId];
          if (!fromPos) return null;
          
          const fromX = fromPos.x + FRAME_WIDTH;
          const fromY = fromPos.y + FRAME_HEIGHT / 2;
          
          let toX = mousePos.x;
          let toY = mousePos.y;
          let isSnapped = false;

          if (hoveredFrameId && hoveredFrameId !== activeConnection.fromId) {
            const targetPos = framePositions[hoveredFrameId];
            if (targetPos) {
              toX = targetPos.x;
              toY = targetPos.y + FRAME_HEIGHT / 2;
              isSnapped = true;
            }
          }

          const deltaX = toX - fromX;
          const controlOffset = Math.min(Math.max(80, Math.abs(deltaX) * 0.6), 200);

          return (
            <g>
              <path
                d={`M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`}
                stroke={isSnapped ? "#3b82f6" : "#60a5fa"}
                strokeWidth={isSnapped ? "3" : "2"}
                strokeDasharray={isSnapped ? "none" : "8,4"}
                fill="none"
                markerEnd="url(#arrowhead-draft)"
                className={isSnapped ? "animate-pulse" : ""}
                opacity={isSnapped ? "1" : "0.6"}
              />
              <circle cx={fromX} cy={fromY} r="6" fill="#3b82f6" filter="url(#glow-strong)" />
              {isSnapped && (
                <circle cx={toX} cy={toY} r="8" fill="#3b82f6" opacity="0.4" className="animate-ping" />
              )}
            </g>
          );
        })()
      )}
    </svg>
  );
};
