'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  label: string;
  name: string;
  properties: Record<string, unknown>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  type: string;
  properties: Record<string, unknown>;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/graph/data');
      const graphData = await response.json();
      setData(graphData);
      setError(null);
    } catch (err) {
      setError('Failed to load graph data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 1200;
    const height = 800;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Create container for zoom
    const g = svg.append('g');

    // Define colors for different node types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['User', 'Message', 'Entity', 'Topic'])
      .range(['#4F46E5', '#10B981', '#F59E0B', '#EF4444']);

    // Create force simulation
    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(data.links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create arrow markers for relationships
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .join('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');

    // Draw link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(data.links)
      .join('text')
      .attr('font-size', 10)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => d.type);

    // Draw nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', 20)
      .attr('fill', d => colorScale(d.label))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(drag(simulation) as any)
      .on('click', (event, d) => {
        setSelectedNode(d);
      })
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 25)
          .attr('stroke-width', 3);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 20)
          .attr('stroke-width', 2);
      });

    // Add node labels
    const label = g.append('g')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dy', 35)
      .attr('fill', '#333')
      .text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name)
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      linkLabel
        .attr('x', d => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr('y', d => ((d.source as Node).y! + (d.target as Node).y!) / 2);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      label
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Drag behavior
    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading knowledge graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-10">
        <h2 className="text-lg font-bold mb-2">Knowledge Graph</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
            <span>User</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span>Message</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span>Entity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Topic</span>
          </div>
        </div>
        <button
          onClick={fetchGraphData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full"
        >
          Refresh
        </button>
      </div>

      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10 max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold">{selectedNode.label}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="text-sm space-y-2">
            <p className="font-semibold">{selectedNode.name}</p>
            <div className="mt-2 text-xs text-gray-600">
              <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                {JSON.stringify(selectedNode.properties, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <svg ref={svgRef} className="border border-gray-300 rounded-lg bg-gray-50"></svg>

      <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow text-sm">
        <p>💡 Drag nodes to rearrange • Scroll to zoom • Click nodes for details</p>
      </div>
    </div>
  );
}