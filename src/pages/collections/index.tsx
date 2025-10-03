import { useState } from 'react';
import { motion } from 'motion/react';
import {
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineSquares2X2,
  HiOutlineMagnifyingGlass,
  HiOutlineAdjustmentsHorizontal,
} from 'react-icons/hi2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Artifact {
  id: string;
  type: 'note' | 'graph' | 'visualization';
  title: string;
  description: string;
  sourceCount: number;
  tags: string[];
  createdAt: string;
  thumbnail?: string;
}

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Mock artifacts - replace with data from Supabase
  const mockArtifacts: Artifact[] = [
    {
      id: '1',
      type: 'note',
      title: 'Microgravity Effects on Plant Growth',
      description: 'Comprehensive summary of root development studies conducted on ISS',
      sourceCount: 12,
      tags: ['Plants', 'ISS', 'Root Systems'],
      createdAt: '2 hours ago',
    },
    {
      id: '2',
      type: 'graph',
      title: 'Mars Mission Research Network',
      description: 'Entity relationships between radiation studies and mission planning',
      sourceCount: 24,
      tags: ['Mars', 'Radiation', 'Mission Planning'],
      createdAt: '1 day ago',
    },
    {
      id: '3',
      type: 'visualization',
      title: 'Cell Division Timeline',
      description: 'Temporal analysis of mitosis rates across multiple experiments',
      sourceCount: 8,
      tags: ['Cellular Biology', 'Mitosis'],
      createdAt: '3 days ago',
    },
    {
      id: '4',
      type: 'note',
      title: 'Bone Density Research Summary',
      description: 'Key findings from long-duration spaceflight studies',
      sourceCount: 15,
      tags: ['Human Health', 'Skeletal System'],
      createdAt: '5 days ago',
    },
  ];

  const filteredArtifacts = mockArtifacts.filter((artifact) => {
    const matchesSearch = artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || artifact.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getArtifactIcon = (type: Artifact['type']) => {
    switch (type) {
      case 'note':
        return HiOutlineDocumentText;
      case 'graph':
        return HiOutlineSquares2X2;
      case 'visualization':
        return HiOutlineChartBar;
    }
  };

  const getArtifactColor = (type: Artifact['type']) => {
    switch (type) {
      case 'note':
        return 'from-blue-500 to-cyan-500';
      case 'graph':
        return 'from-purple-500 to-pink-500';
      case 'visualization':
        return 'from-green-500 to-emerald-500';
    }
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-scheme-muted">
        <HiOutlineSquares2X2 className="h-12 w-12 text-scheme-muted-text" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-scheme-text">
        No artifacts yet
      </h3>
      <p className="mb-6 max-w-md text-scheme-muted-text">
        Start exploring in Discover and save summaries, visualizations, and knowledge graphs to build your collection.
      </p>
      <Button onClick={() => (window.location.href = '/discover')}>
        Start Exploring
      </Button>
    </motion.div>
  );

  return (
    <div className="h-full w-full">
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-scheme-text md:text-4xl">
                Collections
              </h1>
              <p className="mt-2 text-lg text-scheme-muted-text">
                Your saved artifacts, insights, and discoveries
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-md">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-scheme-muted-text" />
                <Input
                  placeholder="Search artifacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <HiOutlineAdjustmentsHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="note">Notes</TabsTrigger>
              <TabsTrigger value="graph">Graphs</TabsTrigger>
              <TabsTrigger value="visualization">Visualizations</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredArtifacts.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredArtifacts.map((artifact, index) => {
                    const Icon = getArtifactIcon(artifact.type);
                    const colorClass = getArtifactColor(artifact.type);

                    return (
                      <motion.div
                        key={artifact.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="group h-full cursor-pointer transition-all hover:border-biosphere-500 hover:shadow-xl">
                          <div className="p-5 space-y-4">
                            {/* Icon and Type */}
                            <div className="flex items-start justify-between">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass}`}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                              <Badge variant="secondary" className="capitalize">
                                {artifact.type}
                              </Badge>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                              <h3 className="font-semibold text-scheme-text line-clamp-2 group-hover:text-biosphere-500 transition-colors">
                                {artifact.title}
                              </h3>
                              <p className="text-sm text-scheme-muted-text line-clamp-2">
                                {artifact.description}
                              </p>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5">
                              {artifact.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 text-xs text-scheme-muted-text">
                              <span>{artifact.sourceCount} sources</span>
                              <span>{artifact.createdAt}</span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
