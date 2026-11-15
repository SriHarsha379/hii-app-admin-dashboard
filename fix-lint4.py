with open("src/pages/PollsContests.tsx", "r") as f:
    src = f.read()

first = src.find("  const cityOptions = [")
second = src.find("  const cityOptions = [", first + 1)
if second != -1:
    end = src.find("];\n", second) + 3
    end2 = src.find("];\n", end) + 3
    src = src[:second] + src[end2:]
    print("fix-1 done: duplicate cityOptions removed")
else:
    print("fix-1 SKIP: no duplicate found")

first2 = src.find("  const citySelectOptions = [")
second2 = src.find("  const citySelectOptions = [", first2 + 1)
if second2 != -1:
    end3 = src.find("];\n", second2) + 3
    end4 = src.find("];\n", end3) + 3
    src = src[:second2] + src[end4:]
    print("fix-1b done: duplicate citySelectOptions removed")

with open("src/pages/PollsContests.tsx", "w") as f:
    f.write(src)

with open("src/pages/Settings.tsx", "r") as f:
    src = f.read()

if "Loader2" not in src.split("from 'lucide-react'")[0] + src.split("from 'lucide-react'")[0]:
    imports_match = src.find("} from 'lucide-react';")
    if imports_match != -1:
        insert_pos = src.rfind("\n", 0, imports_match)
        src = src[:insert_pos] + "\n  Loader2," + src[insert_pos:]
        print("fix-2 done: Loader2 added to Settings.tsx imports")
    else:
        print("fix-2 SKIP: could not find lucide import block")
else:
    print("fix-2 SKIP: Loader2 already imported")

import re
if re.search(r"import \{[^}]*Loader2[^}]*\} from 'lucide-react'", src):
    print("fix-2 verified: Loader2 already in imports")
else:
    src = src.replace(
        "  Save,\n  CheckCircle2,",
        "  Save,\n  CheckCircle2,\n  Loader2,"
    )
    print("fix-2 done: Loader2 injected via Save anchor")

with open("src/pages/Settings.tsx", "w") as f:
    f.write(src)

