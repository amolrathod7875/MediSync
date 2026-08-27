import { useState } from "react";
import { Moon, Sun, User, Mail, Building2, Shield, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [profile, setProfile] = useState({
    name: "Dr. Sarah Chen",
    email: "s.chen@medisync.health",
    specialty: "Internal Medicine",
    hospital: "Metro General Hospital",
    npi: "1234567890",
  });

  const toggleTheme = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
  };

  const handleSave = () => {
    toast.success("Settings saved");
  };

  return (
    <div className="bg-dot-grid min-h-full p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-6">Settings</h1>

      {/* Appearance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Customize the look and feel of MediSync</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-[hsl(38,92%,50%)]" />}
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your physician information</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1 text-xs"><Shield className="h-3 w-3" /> Verified</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(270,60%,55%)] to-[hsl(290,60%,45%)] text-lg font-bold text-white">
              SC
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.specialty}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-1.5"><User className="h-3 w-3" /> Full Name</Label>
              <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</Label>
              <Input id="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specialty">Specialty</Label>
              <Input id="specialty" value={profile.specialty} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hospital" className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Hospital</Label>
              <Input id="hospital" value={profile.hospital} onChange={(e) => setProfile({ ...profile, hospital: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="npi">NPI Number</Label>
              <Input id="npi" value={profile.npi} onChange={(e) => setProfile({ ...profile, npi: e.target.value })} className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-1.5 shimmer-btn border-0 text-white">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
