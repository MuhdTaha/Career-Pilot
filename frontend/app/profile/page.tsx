"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, ArrowLeft, UploadCloud } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial State matching MasterResume
  const [profile, setProfile] = useState({
    full_name: "",
    summary: "",
    skills: [""],
    experience: [{ company: "", role: "", duration: "", description: [""] }],
    projects: [{ name: "", description: [""] }],
    education: [{ institution: "", degree: "", major: "", graduation_year: "" }]
  });

  // Load Data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const res = await fetch(`http://localhost:8000/api/profile/${user.uid}`);
          const data = await res.json();
          // If data exists, merge it. If array is empty, keep at least one empty object for the UI
          if (data.user_id) {
            setProfile({
              ...data,
              skills: data.skills.length ? data.skills : [""],
              experience: data.experience.length ? data.experience : [{ company: "", role: "", duration: "", description: [""] }],
              projects: data.projects.length ? data.projects : [{ name: "", description: [""] }],
            });
          }
        } catch (e) { console.error(e); }
      }
    });
    return () => unsub();
  }, []);

  // File upload 
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return;

    const file = e.target.files[0];
    setParsing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`http://localhost:8000/api/resume/parse`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // Merge parsed data into profile state
      if (data.full_name) {
        setProfile({
          ...profile, // Keep existing structure defaults
          full_name: data.full_name || "",
          summary: data.summary || "",
          skills: data.skills || [""],
          experience: data.experience || [],
          projects: data.projects || [],
          education: data.education || []
        });
        alert("Resume parsed successfully! Please review the data.");
      } else {
        alert("Failed to parse resume. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while parsing the resume. Please try again.");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setLoading(true);
    // Filter out empty strings/objects before sending
    const cleanProfile = {
      ...profile,
      user_id: userId,
      skills: profile.skills.filter(s => s.trim() !== ""),
      experience: profile.experience.filter(e => e.company.trim() !== ""),
    };

    await fetch(`http://localhost:8000/api/profile/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanProfile),
    });
    setLoading(false);
    alert("Profile Saved!");
  };

  // --- Helper: Skills ---
  const handleSkillChange = (idx: number, val: string) => {
    const newSkills = [...profile.skills];
    newSkills[idx] = val;
    setProfile({ ...profile, skills: newSkills });
  };

  
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Link href="/">
                <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5"/></Button>
             </Link>
             <h1 className="text-3xl font-bold text-slate-900">Master Profile</h1>
          </div>
          
          <div className="flex gap-2">
            {/* Hidden Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf" 
                className="hidden" 
            />
            
            {/* Import Button */}
            <Button 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing || loading}
            >
                <UploadCloud className="mr-2 h-4 w-4" /> 
                {parsing ? "Parsing PDF..." : "Import Resume"}
            </Button>

            <Button onClick={handleSave} disabled={loading || parsing}>
                <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
        
        {/* 1. Basics */}
        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="Jane Doe"/>
            </div>
            <div className="grid gap-2">
                <Label>Professional Summary</Label>
                <Textarea 
                    value={profile.summary} 
                    onChange={e => setProfile({...profile, summary: e.target.value})} 
                    placeholder="Briefly describe your background..."
                    className="h-24"
                />
            </div>
          </CardContent>
        </Card>

        {/* 2. Skills */}
        <Card>
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {profile.skills.map((skill, i) => (
                    <div key={i} className="flex gap-2">
                        <Input value={skill} onChange={e => {
                             const newSkills = [...profile.skills];
                             newSkills[i] = e.target.value;
                             setProfile({...profile, skills: newSkills});
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => {
                            const ns = profile.skills.filter((_, idx) => idx !== i);
                            setProfile({...profile, skills: ns});
                        }}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                    </div>
                ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setProfile({...profile, skills: [...profile.skills, ""]})}>
                <Plus className="mr-2 h-4 w-4"/> Add Skill
            </Button>
          </CardContent>
        </Card>

        {/* 3. Experience */}
        <Card>
            <CardHeader><CardTitle>Work Experience</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                {profile.experience.map((exp, i) => (
                    <div key={i} className="p-4 border rounded-lg bg-slate-50 space-y-3 relative group">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500"
                            onClick={() => {
                                const ne = profile.experience.filter((_, idx) => idx !== i);
                                setProfile({...profile, experience: ne});
                            }}
                        >
                            <Trash2 className="h-4 w-4"/>
                        </Button>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Company</Label>
                                <Input value={exp.company} onChange={(e) => {
                                    const ne = [...profile.experience]; ne[i].company = e.target.value;
                                    setProfile({...profile, experience: ne});
                                }}/>
                            </div>
                            <div>
                                <Label>Role</Label>
                                <Input value={exp.role} onChange={(e) => {
                                    const ne = [...profile.experience]; ne[i].role = e.target.value;
                                    setProfile({...profile, experience: ne});
                                }}/>
                            </div>
                        </div>
                        <div>
                             <Label>Description (One bullet per line)</Label>
                             <Textarea value={exp.description.join('\n')} onChange={(e) => {
                                 const ne = [...profile.experience]; ne[i].description = e.target.value.split('\n');
                                 setProfile({...profile, experience: ne});
                             }} className="h-32"/>
                        </div>
                    </div>
                ))}
                <Button variant="outline" onClick={() => setProfile({
                    ...profile, 
                    experience: [...profile.experience, {company: "", role: "", duration: "", description: [""]}]
                })}>
                    <Plus className="mr-2 h-4 w-4"/> Add Role
                </Button>
            </CardContent>
        </Card>

        {/* 4. Education (New Section to match parsing) */}
        <Card>
            <CardHeader><CardTitle>Education</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                {profile.education.map((edu, i) => (
                    <div key={i} className="p-4 border rounded-lg bg-slate-50 space-y-3 relative group">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500"
                            onClick={() => {
                                const ne = profile.education.filter((_, idx) => idx !== i);
                                setProfile({...profile, education: ne});
                            }}
                        >
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Institution</Label><Input value={edu.institution} onChange={e => {
                                const ne = [...profile.education]; ne[i].institution = e.target.value; setProfile({...profile, education: ne});
                            }}/></div>
                            <div><Label>Degree</Label><Input value={edu.degree} onChange={e => {
                                const ne = [...profile.education]; ne[i].degree = e.target.value; setProfile({...profile, education: ne});
                            }}/></div>
                        </div>
                    </div>
                ))}
                 <Button variant="outline" onClick={() => setProfile({
                    ...profile, 
                    education: [...profile.education, {institution: "", degree: "", major: "", graduation_year: ""}]
                })}>
                    <Plus className="mr-2 h-4 w-4"/> Add Education
                </Button>
            </CardContent>
        </Card>

      </div>
    </main>
  );
}