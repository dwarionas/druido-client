"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { updateProfile, changePassword } from "@/lib/decks-api";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flame, Star } from "lucide-react";

export default function ProfilePage() {
    const { user, updateUser, refreshUser } = useAuth();
    const { t } = useI18n();

    const [name, setName] = React.useState(user?.name ?? "");
    const [dailyGoal, setDailyGoal] = React.useState(user?.dailyGoal ?? 20);
    const [saving, setSaving] = React.useState(false);

    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [changingPassword, setChangingPassword] = React.useState(false);

    React.useEffect(() => {
        if (user) {
            setName(user.name ?? "");
            setDailyGoal(user.dailyGoal ?? 20);
        }
    }, [user]);

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateProfile({ name: name.trim(), dailyGoal });
            updateUser(updated);
            toast.success(t("profile.saved"));
        } catch {
            toast.error("Error saving profile");
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        if (!currentPassword || !newPassword || newPassword.length < 6) return;
        setChangingPassword(true);
        try {
            await changePassword({ currentPassword, newPassword });
            toast.success(t("profile.password_changed"));
            setCurrentPassword("");
            setNewPassword("");
        } catch {
            toast.error("Incorrect current password");
        } finally {
            setChangingPassword(false);
        }
    }

    if (!user) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500 max-w-xl mx-auto py-6">
            <h1 className="text-3xl font-bold tracking-tight">{t("profile.title")}</h1>

            {/* Profile info */}
            <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("profile.email")}</Label>
                    <Input value={user.email} disabled className="bg-muted text-muted-foreground border-border" />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("profile.name")}</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("profile.name")} />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("profile.daily_goal")}</Label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={1}
                            max={100}
                            value={dailyGoal}
                            onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                            className="flex-1 accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="w-12 text-center text-sm font-medium bg-secondary text-secondary-foreground rounded-md py-1">{dailyGoal}</span>
                    </div>
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                    {saving ? "..." : t("profile.save")}
                </Button>
            </form>

            {/* Language */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">{t("profile.language")}</h2>
                <LanguageSwitcher />
            </div>

            {/* Change password (not available for the shared demo account) */}
            {!user.isDemo && (
            <form onSubmit={handleChangePassword} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold">{t("profile.change_password")}</h2>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("profile.current_password")}</Label>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("profile.new_password")}</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min 6 characters" />
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={changingPassword || !currentPassword || newPassword.length < 6}>
                    {changingPassword ? "..." : t("profile.change_password")}
                </Button>
            </form>
            )}

            {/* Reset Demo */}
            {user.isDemo && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 space-y-3">
                <h2 className="text-lg font-semibold text-destructive">{t("demo.reset")}</h2>
                <p className="text-sm font-medium text-destructive/80">{t("demo.reset.desc")}</p>
                <Button
                    variant="destructive"
                    onClick={async () => {
                        try {
                            await api.post("/auth/demo/reset");
                            await refreshUser();
                            toast.success(t("demo.reset.success"));
                            window.location.href = "/app";
                        } catch {
                            toast.error("Reset failed");
                        }
                    }}
                >
                    {t("demo.reset.confirm")}
                </Button>
            </div>
            )}

            {/* Stats summary */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
                    <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-orange-500" /> {user.streak} {t("stats.streak")}</span>
                    <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-500" /> {user.xp} XP</span>
                    {user.createdAt && (
                        <span className="text-muted-foreground w-full sm:w-auto">{t("stats.member_since")} {new Date(user.createdAt).toLocaleDateString()}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
