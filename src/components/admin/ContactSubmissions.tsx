import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Clock } from 'lucide-react';

interface Submission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const ContactSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setSubmissions((data as Submission[]) || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('contact_submissions').update({ read: true }).eq('id', id);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, read: true } : s));
  };

  if (loading) return <Skeleton className="h-64" />;

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No contact submissions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Contact Submissions</h2>
        <Badge variant="secondary">
          {submissions.filter(s => !s.read).length} unread
        </Badge>
      </div>
      {submissions.map((s) => (
        <Card
          key={s.id}
          className={`cursor-pointer transition-colors ${!s.read ? 'border-primary/30 bg-primary/5' : ''}`}
          onClick={() => !s.read && markAsRead(s.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-foreground">
                  {s.first_name} {s.last_name}
                  {!s.read && <Badge className="ml-2 text-[10px]" variant="default">New</Badge>}
                </p>
                <a href={`mailto:${s.email}`} className="text-sm text-primary hover:underline">{s.email}</a>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(s.created_at).toLocaleDateString()}
              </div>
            </div>
            <p className="font-medium text-sm text-foreground mb-1">{s.subject}</p>
            <p className="text-sm text-muted-foreground line-clamp-3">{s.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
