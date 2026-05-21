import { useNavigate } from 'react-router-dom';
import { TalentProfile } from '../../types';
import { Card, CardContent, Badge, Progress, Button } from '@digihire/shared';
import {
  MapPin,
  Briefcase,
  Linkedin,
  Globe,
  CheckCircle,
  TrendingUp,
  Target,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface Props {
  profile: TalentProfile;
}

export default function TalentProfileView({ profile }: Props) {
  const navigate = useNavigate();
  const pct = profile.profile_completion ?? 0;
  const firstName = (profile.full_name || 'there').split(' ')[0];
  const initials = (profile.full_name || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const stats = [
    { label: 'Experience', value: `${profile.experience_years || 0}y`, icon: Briefcase },
    { label: 'Status', value: profile.availability || 'Available', icon: CheckCircle },
    { label: 'Location', value: profile.city || '—', icon: MapPin },
    { label: 'Completion', value: `${pct}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-display">
          Welcome, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your talent profile at a glance</p>
      </div>

      {/* Profile header card */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-primary/15 flex items-center justify-center text-2xl md:text-3xl font-bold font-display text-primary shrink-0 self-center sm:self-auto">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl md:text-2xl font-bold font-display truncate">
                {profile.full_name}
              </h2>
              <p className="text-sm text-primary font-medium mt-1">
                {profile.role_interests?.join(' • ') || 'Sales Professional'}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.city}, {profile.country}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {profile.experience_years || 0} yrs exp
                </span>
                <span className="inline-flex items-center gap-1.5 text-success font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {profile.availability || 'Available'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-center sm:justify-end shrink-0">
              {profile.linkedin_url && (
                <SocialLink href={profile.linkedin_url} icon={<Linkedin className="h-4 w-4" />} />
              )}
              {profile.portfolio_url && (
                <SocialLink href={profile.portfolio_url} icon={<Globe className="h-4 w-4" />} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-base md:text-xl font-bold font-display capitalize truncate">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile completion banner */}
      {pct < 100 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Target className="h-4 w-4" /> Profile Completion
              </div>
              <div className="flex justify-between items-end mb-1">
                <p className="text-2xl font-bold font-display">{pct}%</p>
                <p className="text-xs text-muted-foreground">
                  {pct >= 80
                    ? 'Almost there'
                    : pct >= 50
                    ? 'Halfway there'
                    : 'Just getting started'}
                </p>
              </div>
              <Progress value={pct} className="h-2.5 bg-secondary/50" />
              <p className="text-[11px] text-muted-foreground italic pt-1">
                {pct < 50
                  ? 'Add your bio, skills, and work history to boost your profile.'
                  : pct < 80
                  ? 'Add your CV and LinkedIn to reach 80% and get noticed by brands.'
                  : 'Great profile! Brands can now discover you.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/talent/setup')}
              className="shrink-0 bg-background hover:bg-primary/10"
            >
              Complete <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bio + preferences */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-sm font-semibold mb-3">Professional Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio ||
                  'No bio provided yet. Add a short summary so brands know what you bring to the table.'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-sm font-semibold mb-3">Work Experience</h3>
              <p className="text-sm text-muted-foreground italic">
                Work history details will appear here as you add them.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-4 md:p-6 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Preferences
              </h3>
              <div className="space-y-3 pt-1">
                <DetailItem
                  label="Job Type"
                  value={profile.job_type_preference?.join(', ') || 'Any'}
                />
                <DetailItem label="Work Mode" value={profile.work_preference} />
                <DetailItem
                  label="Salary Expectation"
                  value={profile.salary_min ? String(profile.salary_min) : 'Negotiable'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Top Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills?.length ? (
                  profile.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs font-medium">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No skills listed. Add a few in your profile setup.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
}

function SocialLink({ href, icon }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="h-9 w-9 rounded-lg border border-border/50 bg-secondary/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
    >
      {icon}
    </a>
  );
}

interface DetailItemProps {
  label: string;
  value?: string | null;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right capitalize">{value || 'Not set'}</span>
    </div>
  );
}
