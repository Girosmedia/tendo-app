'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Scan } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (sku: string) => void;
  disabled?: boolean;
}

export function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const [input, setInput] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus el input al montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Detectar escaneo automático (entrada rápida + Enter)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // Si es Enter y hubo entrada rápida (< 50ms entre teclas), es scanner
      if (e.key === 'Enter' && input && timeDiff < 50) {
        handleScan();
      }

      setLastKeyTime(currentTime);
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [input, lastKeyTime]);

  const handleScan = () => {
    if (!input.trim()) return;
    onScan(input.trim());
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Escanea o escribe el código de barras / SKU..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          className="pl-10 text-lg h-12"
          autoFocus
        />
      </div>
      <Button 
        type="submit" 
        disabled={disabled || !input.trim()}
        size="lg"
      >
        <Search className="mr-2 h-5 w-5" />
        Buscar
      </Button>
    </form>
  );
}
