with open('scripts/content.js', 'r') as f:
    lines = f.readlines()

out = []
i = 0
while i < len(lines):
    line = lines[i]
    if "chrome.runtime.sendMessage({" in line and "type: 'GENERATE_SINGLE_SOLUTION'" in lines[i+1]:
        out.append("    try {\n")
        out.append("  " + line)
        i += 1
        while i < len(lines):
            line2 = lines[i]
            out.append("  " + line2)
            if "});" in line2 and "tabs.forEach" not in line2 and "renderTabBody" not in line2 and "if (loader)" not in line2:
                # Need to be careful here, the end of the chrome.runtime.sendMessage block
                if "      });" in line2:
                    out.append("    } catch (e) {\n")
                    out.append("      if (loader) loader.stop();\n")
                    out.append("      tabs.forEach(t => { t.disabled = false; t.style.opacity = ''; });\n")
                    out.append("      alert('Extension context invalidated. Please refresh the page.');\n")
                    out.append("    }\n")
                    i += 1
                    break
            i += 1
        continue
    out.append(line)
    i += 1

with open('scripts/content.js', 'w') as f:
    f.writelines(out)
