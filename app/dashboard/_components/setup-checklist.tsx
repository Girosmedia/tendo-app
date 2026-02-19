'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  path: string;
}

interface SetupData {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  isSetupComplete: boolean;
  showChecklist: boolean;
}

export function SetupChecklist() {
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('setup-checklist-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }

    fetch('/api/organizations/check-setup')
      .then((res) => res.json())
      .then((data) => {
        setSetupData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading setup checklist:', error);
        setIsLoading(false);
      });
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('setup-checklist-dismissed', 'true');
  };

  if (isLoading || isDismissed || !setupData || !setupData.showChecklist) {
    return null;
  }

  const progress = (setupData.completedCount / setupData.totalCount) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">¡Completa tu configuración!</CardTitle>
                  <CardDescription>
                    {setupData.completedCount} de {setupData.totalCount} tareas completadas
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-2"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {setupData.tasks.map((task) => (
              <Link key={task.id} href={task.path}>
                <div className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent">
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.completed ? 'text-muted-foreground line-through' : ''}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  </div>
                  {!task.completed && (
                    <span className="text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Ir →
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
