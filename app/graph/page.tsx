import KnowledgeGraph from '@/components/visualization/KnowledgeGraph';

export default function GraphPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chorus Knowledge Graph</h1>
        <KnowledgeGraph />
      </div>
    </main>
  );
}