import { getChapters } from '@/apis/quranAPI';
import quranLogAPI from '@/apis/quranLogAPI';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { parsePoint } from '@/utils/quran';
import format from 'date-fns/format';
import { nl } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function VoortgangTab({ student }) {
  const [chapters, setChapters] = useState([]);
  const [latestQuranLog, setLatestQuranLog] = useState(null);
  const [latestQuranLogLoading, setLatestQuranLogLoading] = useState(false);

  // Load Quran chapters once (for surah names)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cs = await getChapters();
        if (!active) return;
        setChapters(cs || []);
      } catch (e) {
        console.error('Failed to load Quran chapters', e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Load latest Quran log for this student
  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!student?.id) {
        if (active) {
          setLatestQuranLog(null);
          setLatestQuranLogLoading(false);
        }
        return;
      }

      setLatestQuranLogLoading(true);
      try {
        const all = await quranLogAPI.get_logs();
        if (!active) return;
        const sid = Number(student.id);
        const filtered = (all || []).filter((l) => Number(l.student_id) === sid);
        if (!filtered.length) {
          setLatestQuranLog(null);
          return;
        }
        filtered.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );
        setLatestQuranLog(filtered[0]);
      } catch (e) {
        console.error('Failed to load Quran logs for student', e);
        if (active) setLatestQuranLog(null);
      } finally {
        if (active) setLatestQuranLogLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [student?.id]);

  const chapterById = useMemo(
    () => new Map((chapters || []).map((c) => [String(c.id), c])),
    [chapters]
  );

  const formatLogDate = (value) => {
    if (!value) return 'Onbekend';
    try {
      const dt = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(dt.getTime())) return 'Onbekend';
      return format(dt, 'dd-MM-yyyy', { locale: nl });
    } catch {
      return 'Onbekend';
    }
  };

  const formatPointLabel = (raw) => {
    if (!raw) return '—';
    const p = parsePoint(String(raw));
    const parts = [];
    if (p.surahId) {
      const chapter = chapterById.get(String(p.surahId));
      const name = chapter?.name_simple || `Soera ${p.surahId}`;
      parts.push(name);
    }
    if (p.ayah) parts.push(`Ayah ${p.ayah}`);
    if (p.hizb) parts.push(`Hizb ${p.hizb}`);
    if (!parts.length) return '—';
    return parts.join(' • ');
  };

  const formatScoresShort = (log) => {
    if (!log) return '—';
    const isSet = (v) => v === 0 || (v !== null && v !== undefined && v !== '');
    const fmt = (v) => (isSet(v) ? String(v) : '—');
    const n = log.nourania_score;
    const t = log.tilawa_score;
    const j = log.tajweed_score;
    const h = log.hifdh_score;
    const hasAny = [n, t, j, h].some(isSet);
    if (!hasAny) return '—';
    return `N${fmt(n)} · T${fmt(t)} · J${fmt(j)} · H${fmt(h)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <TrendingUp size={20} />
          Qur'an-voortgang
        </CardTitle>
        <CardDescription>Meest recente log uit het Qur'an-logboek.</CardDescription>
      </CardHeader>
      <CardContent>
        {latestQuranLogLoading ? (
          <p className="text-sm text-muted-foreground">
            Qur'an-log wordt geladen...
          </p>
        ) : !latestQuranLog ? (
          <p className="text-sm text-muted-foreground">
            Nog geen Qur'an-log geregistreerd.
          </p>
        ) : (
          <div className="w-full space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Datum</span>
              <span className="font-medium">
                {formatLogDate(latestQuranLog.date)}
              </span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Bereik</div>
              <div
                className="text-sm font-medium truncate"
                title={formatPointLabel(latestQuranLog.start_log)}
              >
                Van: {formatPointLabel(latestQuranLog.start_log)}
              </div>
              <div
                className="text-sm truncate"
                title={formatPointLabel(latestQuranLog.end_log)}
              >
                Tot: {formatPointLabel(latestQuranLog.end_log)}
              </div>
            </div>
            {latestQuranLog.comment ? (
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground mb-0.5">
                  Omschrijving
                </div>
                <div className="text-sm truncate" title={latestQuranLog.comment}>
                  {latestQuranLog.comment}
                </div>
              </div>
            ) : null}
            <div className="text-xs text-muted-foreground">
              Status:{' '}
              <span className="font-medium">
                {latestQuranLog.completed ? 'Geleerd' : 'Nog in behandeling'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Beoordeling</span>
              <span
                className="font-medium truncate max-w-[60%] text-right"
                title={formatScoresShort(latestQuranLog)}
              >
                {formatScoresShort(latestQuranLog)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


