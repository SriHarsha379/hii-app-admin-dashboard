import re

with open("src/pages/EventAdminOnboarding.tsx", "r") as f:
    src = f.read()

old = "    const timer = setTimeout(() => navigate('/event-profile'), 4000);"
new = "    const timer = setTimeout(() => navigate('/pending-approval'), 4000);"
if old in src:
    src = src.replace(old, new, 1)
    src = src.replace(
        "onClick={() => navigate('/event-profile')}",
        "onClick={() => navigate('/pending-approval')}",
        1
    )
    with open("src/pages/EventAdminOnboarding.tsx", "w") as f:
        f.write(src)
    print("fix-01 done: EventAdminOnboarding success redirects to pending-approval")
else:
    print("fix-01 SKIP: redirect anchor not found")


with open("src/pages/ClaimClubForm.tsx", "r") as f:
    src = f.read()

old_state = "  const [portraitImage, setPortraitImage] = useState<string | null>(null);\n  const [landscapeImage, setLandscapeImage] = useState<string | null>(null);"
new_state = (
    "  const [portraitImage, setPortraitImage]   = useState<string | null>(null);\n"
    "  const [landscapeImage, setLandscapeImage] = useState<string | null>(null);\n"
    "  const [portraitFile, setPortraitFile]     = useState<File | null>(null);\n"
    "  const [landscapeFile, setLandscapeFile]   = useState<File | null>(null);"
)
if old_state in src:
    src = src.replace(old_state, new_state, 1)
    print("fix-02a done: file state added to ClaimClubForm.tsx")
else:
    print("fix-02a SKIP: state anchor not found in ClaimClubForm.tsx")

old_handler = (
    "  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'portrait' | 'landscape') => {\n"
    "    const file = e.target.files?.[0];\n"
    "    if (file) {\n"
    "      const reader = new FileReader();\n"
    "      reader.onloadend = () => {\n"
    "        if (type === 'portrait') setPortraitImage(reader.result as string);\n"
    "        else setLandscapeImage(reader.result as string);\n"
    "      };\n"
    "      reader.readAsDataURL(file);\n"
    "    }\n"
    "  };"
)
new_handler = (
    "  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'portrait' | 'landscape') => {\n"
    "    const file = e.target.files?.[0];\n"
    "    if (file) {\n"
    "      const url = URL.createObjectURL(file);\n"
    "      if (type === 'portrait') { setPortraitImage(url); setPortraitFile(file); }\n"
    "      else { setLandscapeImage(url); setLandscapeFile(file); }\n"
    "    }\n"
    "  };"
)
if old_handler in src:
    src = src.replace(old_handler, new_handler, 1)
    print("fix-02b done: handleImageUpload now stores File objects")
else:
    print("fix-02b SKIP: handler not found in ClaimClubForm.tsx")

old_body_end = (
    "        const res = await fetch(`${API_BASE}/vendor/update_vendor/${club._id}`, {\n"
    "          method: 'PUT',\n"
    "          headers: { Authorization: `Bearer ${token}` },\n"
    "          body,\n"
    "        });\n"
    "        if (!res.ok) {\n"
    "          const json = await res.json().catch(() => ({}));\n"
    "          throw new Error(apiErrorMessage(json, 'Failed to save your changes'));\n"
    "        }\n"
    "      }"
)
new_body_end = (
    "        if (portraitFile)  body.append('venue_image', portraitFile);\n"
    "        if (landscapeFile) body.append('gallery_images', landscapeFile);\n"
    "        const res = await fetch(`${API_BASE}/vendor/update_vendor/${club._id}`, {\n"
    "          method: 'PUT',\n"
    "          headers: { Authorization: `Bearer ${token}` },\n"
    "          body,\n"
    "        });\n"
    "        if (!res.ok) {\n"
    "          const json = await res.json().catch(() => ({}));\n"
    "          throw new Error(apiErrorMessage(json, 'Failed to save your changes'));\n"
    "        }\n"
    "      }"
)
if old_body_end in src:
    src = src.replace(old_body_end, new_body_end, 1)
    print("fix-02c done: photos now appended to claim FormData")
else:
    print("fix-02c SKIP: FormData body anchor not found in ClaimClubForm.tsx")

old_success_btn = "onClick={() => navigate('/club-onboarding')}"
new_success_btn = "onClick={() => navigate('/pending-approval')}"
old_success_label = ">Go back to login screen<"
new_success_label = ">View Approval Status<"
if old_success_btn in src:
    src = src.replace(old_success_btn, new_success_btn, 1)
    print("fix-03a done: success button navigates to pending-approval")
else:
    print("fix-03a SKIP: success navigate not found in ClaimClubForm.tsx")

if old_success_label in src:
    src = src.replace(old_success_label, new_success_label, 1)
    print("fix-03b done: success button label corrected")
else:
    print("fix-03b SKIP: success label not found in ClaimClubForm.tsx")

with open("src/pages/ClaimClubForm.tsx", "w") as f:
    f.write(src)


with open("src/pages/ForgotPassword.tsx", "r") as f:
    src = f.read()

src = src.replace("&copy; 2024 Hii App", "&copy; 2026 Hii App")
with open("src/pages/ForgotPassword.tsx", "w") as f:
    f.write(src)
print("fix-04 done: ForgotPassword copyright year updated to 2026")


with open("src/pages/PendingApproval.tsx", "r") as f:
    src = f.read()

old_reload = "onClick={() => window.location.reload()}"
new_reload = (
    "onClick={async () => {\n"
    "            try {\n"
    "              const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });\n"
    "              const json = await res.json();\n"
    "              const list = Array.isArray(json.data) ? json.data : [];\n"
    "              const mine = list.find((v: any) => v.name === user?.organisation);\n"
    "              if (mine?.is_verified) window.location.reload();\n"
    "            } catch { window.location.reload(); }\n"
    "          }}"
)
if old_reload in src:
    if "API_BASE" not in src:
        src = src.replace(
            "import { Clock, LogOut, RefreshCw } from 'lucide-react';",
            "import { Clock, LogOut, RefreshCw } from 'lucide-react';\nimport { API_BASE } from '../lib/apiConfig';"
        )
    src = src.replace(old_reload, new_reload, 1)
    with open("src/pages/PendingApproval.tsx", "w") as f:
        f.write(src)
    print("fix-05 done: PendingApproval Check Status now queries backend")
else:
    print("fix-05 SKIP: reload anchor not found in PendingApproval.tsx")

print("\nAll round-6 fixes attempted. Run: npm run lint")
