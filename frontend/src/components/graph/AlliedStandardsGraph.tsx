'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GitBranch, ExternalLink, Shield, CheckCircle2, Info, ArrowRight } from 'lucide-react';

export interface GraphNode {
  id: string;
  number: string;
  title: string;
  type: string;
  relationship: 'CENTRAL' | 'TEST_METHOD' | 'ALLIED_COMPONENT' | 'NORMATIVE_REFERENCE' | 'SURFACE_FINISH' | 'RAW_MATERIAL';
  description: string;
  mandatory?: boolean;
}

interface AlliedStandardsGraphProps {
  centralStandard?: string;
  centralTitle?: string;
  customNodes?: GraphNode[];
}

const DEFAULT_NODES: GraphNode[] = [
  {
    id: 'is-1239',
    number: 'IS 1239 (Part 1)',
    title: 'Steel Tubes, Tubulars and Other Wrought Steel Fittings',
    type: 'PRODUCT STANDARD',
    relationship: 'CENTRAL',
    description: 'Primary product standard for mild steel tubes used for water, gas, and steam.',
    mandatory: true,
  },
  {
    id: 'is-1387',
    number: 'IS 1387',
    title: 'General Requirements for Supply of Metallurgical Materials',
    type: 'TEST_METHOD',
    relationship: 'TEST_METHOD',
    description: 'Defines mandatory chemical sampling and quality inspection protocol for IS 1239 pipes.',
    mandatory: true,
  },
  {
    id: 'is-6392',
    number: 'IS 6392',
    title: 'Steel Pipe Flanges for Water, Gas & Steam Pipelines',
    type: 'ALLIED_COMPONENT',
    relationship: 'ALLIED_COMPONENT',
    description: 'Essential allied fitting standard required for connecting IS 1239 pipeline joints.',
    mandatory: false,
  },
  {
    id: 'is-1608',
    number: 'IS 1608 (Part 1)',
    title: 'Metallic Materials — Tensile Testing at Ambient Temperature',
    type: 'TEST_METHOD',
    relationship: 'NORMATIVE_REFERENCE',
    description: 'Normative test method to verify tensile strength & elongation parameters for pipes.',
    mandatory: true,
  },
  {
    id: 'is-4736',
    number: 'IS 4736',
    title: 'Hot-Dip Zinc Coatings on Mild Steel Tubes',
    type: 'SURFACE_FINISH',
    relationship: 'SURFACE_FINISH',
    description: 'Mandatory galvanizing specification for corrosion resistance in potable water mains.',
    mandatory: true,
  },
  {
    id: 'is-2062',
    number: 'IS 2062',
    title: 'Hot Rolled Medium and High Tensile Structural Steel',
    type: 'RAW_MATERIAL',
    relationship: 'RAW_MATERIAL',
    description: 'Base raw steel specification ensuring chemical purity (C, Mn, S, P limits).',
    mandatory: true,
  },
];

export default function AlliedStandardsGraph({
  centralStandard = 'IS 1239 (Part 1)',
  centralTitle = 'Steel Tubes, Tubulars and Other Wrought Steel Fittings',
  customNodes,
}: AlliedStandardsGraphProps) {
  const nodes = customNodes || DEFAULT_NODES;
  const [selectedNode, setSelectedNode] = useState<GraphNode>(nodes[0]);

  // Center node is at (350, 200) in 700x400 coordinate system
  const centerX = 350;
  const centerY = 200;
  const radius = 175;

  const alliedNodes = nodes.filter(n => n.relationship !== 'CENTRAL');

  // Compute radial coordinates for allied nodes
  const nodePositions = alliedNodes.map((node, i) => {
    const angle = (i * (2 * Math.PI / alliedNodes.length)) - (Math.PI / 2);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { ...node, x, y, angle };
  });

  const getRelBadgeColor = (rel: string) => {
    switch (rel) {
      case 'TEST_METHOD': return { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' };
      case 'ALLIED_COMPONENT': return { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' };
      case 'NORMATIVE_REFERENCE': return { bg: '#faf5ff', text: '#7c3aed', border: '#d8b4fe' };
      case 'SURFACE_FINISH': return { bg: '#ecfdf5', text: '#047857', border: '#6ee7b7' };
      case 'RAW_MATERIAL': return { bg: '#fefce8', text: '#a16207', border: '#fde047' };
      default: return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Official Government Header Ribbon */}
      <div style={{
        background: 'linear-gradient(90deg, #0f2540 0%, #1a3c5e 100%)',
        padding: '16px 24px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #f59e0b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid #f59e0b',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <GitBranch size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#fbbf24' }}>
              Bureau of Indian Standards · Allied Standards Graph
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'white', margin: 0 }}>
              Normative &amp; Interdependent Standards Matrix
            </h3>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.12)',
          padding: '4px 12px',
          borderRadius: 100,
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          Interactive Graph Traversal
        </div>
      </div>

      {/* Main Graph Content */}
      <div className="allied-graph-layout">
        {/* SVG Network Canvas */}
        <div style={{
          padding: '20px',
          background: 'radial-gradient(circle at center, #f8fafc 0%, #f1f5f9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRight: '1px solid var(--color-border)',
        }}>
          <svg
            viewBox="0 0 700 400"
            style={{ width: '100%', height: 'auto', maxHeight: 380 }}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="28"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
              </marker>
            </defs>

            {/* Connecting Lines */}
            {nodePositions.map((node) => {
              const isSelected = selectedNode.id === node.id;
              return (
                <g key={`line-${node.id}`}>
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={node.x}
                    y2={node.y}
                    stroke={isSelected ? '#2563eb' : '#cbd5e1'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    strokeDasharray={isSelected ? 'none' : '4,4'}
                    markerEnd={isSelected ? 'url(#arrow-active)' : 'url(#arrow)'}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  {/* Relationship pill on connection line */}
                  <rect
                    x={(centerX + node.x) / 2 - 38}
                    y={(centerY + node.y) / 2 - 10}
                    width={76}
                    height={20}
                    rx={10}
                    fill={isSelected ? '#2563eb' : 'white'}
                    stroke={isSelected ? '#1d4ed8' : '#e2e8f0'}
                    strokeWidth={1}
                  />
                  <text
                    x={(centerX + node.x) / 2}
                    y={(centerY + node.y) / 2 + 4}
                    textAnchor="middle"
                    fill={isSelected ? 'white' : '#64748b'}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.relationship.replace('_', ' ')}
                  </text>
                </g>
              );
            })}

            {/* Central Node Circle */}
            <g
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedNode(nodes[0])}
            >
              <circle
                cx={centerX}
                cy={centerY}
                r={54}
                fill={selectedNode.relationship === 'CENTRAL' ? '#1a3c5e' : '#0f2540'}
                stroke="#f59e0b"
                strokeWidth={selectedNode.relationship === 'CENTRAL' ? 4 : 2}
                filter="drop-shadow(0 4px 8px rgba(0,0,0,0.15))"
              />
              <text
                x={centerX}
                y={centerY - 8}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="13"
                fontWeight="800"
                fontFamily="JetBrains Mono, monospace"
              >
                {centralStandard}
              </text>
              <text
                x={centerX}
                y={centerY + 10}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                PRIMARY STANDARD
              </text>
              <text
                x={centerX}
                y={centerY + 24}
                textAnchor="middle"
                fill="#93c5fd"
                fontSize="9"
                fontFamily="Inter, sans-serif"
              >
                Mandatory QCO
              </text>
            </g>

            {/* Allied Nodes */}
            {nodePositions.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const styleProps = getRelBadgeColor(node.relationship);
              return (
                <g
                  key={node.id}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                  onClick={() => setSelectedNode(node)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 44 : 38}
                    fill={isSelected ? '#1d4ed8' : 'white'}
                    stroke={isSelected ? '#2563eb' : styleProps.border}
                    strokeWidth={isSelected ? 3 : 2}
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.08))"
                  />
                  <text
                    x={node.x}
                    y={node.y - 4}
                    textAnchor="middle"
                    fill={isSelected ? 'white' : '#0f172a'}
                    fontSize={isSelected ? '12' : '11'}
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.number}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    fill={isSelected ? '#bfdbfe' : styleProps.text}
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.type}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Card */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--color-primary)',
                background: '#eff6ff',
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid #bfdbfe',
              }}>
                {selectedNode.number}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 100,
                background: getRelBadgeColor(selectedNode.relationship).bg,
                color: getRelBadgeColor(selectedNode.relationship).text,
                border: `1px solid ${getRelBadgeColor(selectedNode.relationship).border}`,
                textTransform: 'uppercase',
              }}>
                {selectedNode.relationship.replace('_', ' ')}
              </span>
            </div>

            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8, lineHeight: 1.3 }}>
              {selectedNode.title}
            </h4>

            <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 16 }}>
              {selectedNode.description}
            </p>

            {/* Interdependence Rationale */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={13} style={{ color: 'var(--color-primary)' }} />
                Procurement Compliance Impact
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>
                {selectedNode.relationship === 'CENTRAL' && (
                  <span>Mandatory base specification. Tenders citing IS 1239 must also mandate testing according to IS 1387 and flanges as per IS 6392 to ensure airtight pipeline integrity.</span>
                )}
                {selectedNode.relationship === 'TEST_METHOD' && (
                  <span>Omitting <strong>IS 1387</strong> in tender clauses creates ambiguity during factory acceptance testing (FAT) regarding lot sampling and rejection thresholds.</span>
                )}
                {selectedNode.relationship === 'ALLIED_COMPONENT' && (
                  <span>Procuring IS 1239 pipes without mandating <strong>IS 6392</strong> flange drillings frequently causes site mismatch with valves and pumps, delaying public projects.</span>
                )}
                {selectedNode.relationship === 'NORMATIVE_REFERENCE' && (
                  <span>Tensile verification per <strong>IS 1608</strong> is required to ensure bursting pressure safety compliance before hydro-testing.</span>
                )}
                {selectedNode.relationship === 'SURFACE_FINISH' && (
                  <span>Hot-dip galvanizing per <strong>IS 4736</strong> (minimum 360 g/m² zinc mass) prevents internal pipeline scaling and lead contamination.</span>
                )}
                {selectedNode.relationship === 'RAW_MATERIAL' && (
                  <span>Ensures steel chemistry adheres strictly to <strong>IS 2062 Grade E250</strong> (yield strength ≥ 250 MPa) to prevent catastrophic weld seam failure.</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
            <Link
              href={`/standards/${selectedNode.number.replace(/\s+/g, '%20')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 16px',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}
            >
              <span>Explore Complete Specification for {selectedNode.number}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .allied-graph-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
          gap: 0;
        }
        @media (max-width: 1024px) {
          .allied-graph-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
