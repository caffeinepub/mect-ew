import { Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function VideoManagement() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          La funcionalidad de gestión de videos no está disponible actualmente
        </p>
      </CardContent>
    </Card>
  );
}
