Import-Module BurntToast

Write-Host "Starting Claude..."

# نشغّل Claude في نفس الـ PowerShell
$stallSeconds = 0

# نستخدم Start-Job بس نتابع بدون فتح نافذة جديدة
$job = Start-Job -ScriptBlock { claude code }

while ($true) {
    Start-Sleep 1
    $state = (Get-Job $job.Id).State

    if ($state -eq "Running") {
        $stallSeconds++
    }

    # لو شغال من غير توقف 5 ثواني → غالبًا مستني Input
    if ($stallSeconds -ge 5) {
        # 🔔 صوت قصير
        [System.Media.SystemSounds]::Asterisk.Play()

        # 🪟 Toast Notification
        New-BurntToastNotification -Text "Claude needs your input", "Claude is waiting for your response."

        break
    }

    if ($state -ne "Running") {
        # انتهى job → نخرج
        break
    }
}

# Optionally: cleanup
Remove-Job $job.Id
