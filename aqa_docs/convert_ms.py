import re
import os

def parse_ms(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove PDF headers/footers
    content = re.sub(r'MARK SCHEME – GCSE COMBINED SCIENCE.*?\n', '', content)
    content = re.sub(r'\n\s*\d+\s*\n', '\n', content)

    # Split by question numbers (e.g., 01.1)
    blocks = re.split(r'\n(?=\d{2}\.\d+)', content)

    output = []
    current_major = ""
    major_total = 0

    calc_questions = {
        "01.5": [
            ("formula", "0.25 × 100 / 7.96", 1),
            ("calculation", "3.14070352", 1),
            ("answer", "3.14 (%)", 1)
        ],
        "02.5": [
            ("substitution", "20 = image length / 0.8", 1),
            ("rearrangement", "image length = 0.8 x 20", 1),
            ("answer", "16 (mm)", 1)
        ],
        "03.2": [
            ("substitution", "27 = 68.1 / height^2", 1),
            ("rearrangement", "height^2 = 68.1 ÷ 27", 1),
            ("answer", "1.59 (m)", 1)
        ]
    }

    for block in blocks:
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines: continue

        q_num = lines[0]
        if not re.match(r'\d{2}\.\d+', q_num): continue

        major = q_num.split('.')[0]
        if current_major and current_major != major:
            output.append(f"{{ALIGN RIGHT}}{{BOLD}}Total Question {int(current_major)}: {major_total} marks{{BOLD}}{{ALIGN RIGHT}}\n")
            major_total = 0
        current_major = major

        # Parse block
        answers = []
        extra_info = []
        marks = []
        specs = []
        aos = []
        rpas = []
        is_level = False
        is_any_from = False
        any_count = ""

        for l in lines[1:]:
            if re.match(r'^4\.\d+', l):
                specs.extend(re.findall(r'4\.\d+\.\d+(?:\.\d+)?', l))
            elif re.match(r'^AO[123]', l):
                aos.append(l)
            elif "RPA" in l:
                rpas.append(l)
            elif l.isdigit() and len(l) == 1:
                marks.append(int(l))
            elif "Level" in l or "Indicative content" in l:
                is_level = True
                answers.append(l)
            elif "any" in l.lower() and "from" in l.lower():
                is_any_from = True
                match = re.search(r'any (\w+) from', l, re.I)
                any_count = match.group(1).upper() if match else "ONE"
                answers.append(l)
            elif any(x in l.lower() for x in ["allow", "ignore", "do not accept"]):
                extra_info.append(l)
            elif l == "Total" or (l.isdigit() and int(l) > 5):
                if l.isdigit(): major_total = int(l)
                continue
            else:
                answers.append(l)

        # Header
        spec_text = "/".join(sorted(list(set(specs))))
        ao_text = "/".join(sorted(list(set(aos))))
        rpa_text = f"({rpas[0]})" if rpas else ""
        output.append(f"{spec_text}({ao_text}){rpa_text}")

        sub_total = sum(marks) if marks else 1
        if is_level:
            # Handle Level structure
            output.append(f"{q_num}{{TAB}}{answers[0]} ({marks[0] if marks else '3-4'})")
            for ans in answers[1:]:
                if "Level" in ans:
                    output.append(f"{{TAB}}{{TAB}}{{TAB}}{ans}")
                elif "Indicative content" in ans:
                    output.append(f"\n{{TAB}}{{TAB}}{{TAB}}{ans}")
                elif ans.startswith('•'):
                    output.append(f"{{TAB}}{{TAB}}{{TAB}}•{{TAB}}{ans[1:].strip()}")
                else:
                    output.append(f"{{TAB}}{{TAB}}{{TAB}}{ans}")
            output.append(f"{{TAB_RIGHT}}({sub_total if sub_total > 1 else marks[0] if marks else '?'})")
        elif q_num in calc_questions:
            steps = calc_questions[q_num]
            for idx, (label, val, m) in enumerate(steps):
                tab_right = f"{{TAB_RIGHT}}({sub_total})" if idx == len(steps) - 1 else ""
                if idx == 0:
                    output.append(f"{q_num}{{TAB}}{label}: {val} ({m})")
                else:
                    output.append(f"{{TAB}}{{TAB}}{{TAB}}{label}: {val} ({m}){tab_right}")
        elif is_any_from:
            output.append(f"{q_num}{{TAB}}any {{BOLD}}{any_count}{{BOLD}} from:{{TAB_RIGHT}}({sub_total})")
            for ans in answers:
                if ans.startswith('•'):
                    output.append(f"{{TAB}}{{TAB}}{{TAB}}•{{TAB}}{ans[1:].strip()}")
        else:
            # Standard formatting
            for idx, ans in enumerate(answers):
                if ans.lower() == "or": continue

                mark = f" ({marks[idx]})" if idx < len(marks) else ""
                # Check if next is 'or'
                is_last = (idx == len(answers) - 1)
                tab_right = f"{{TAB_RIGHT}}({sub_total})" if is_last else ""

                if idx == 0:
                    output.append(f"{q_num}{{TAB}}{ans}{mark}{tab_right}")
                elif idx > 0 and answers[idx-1].lower() == "or":
                    output.append(f"{{TAB}}{{TAB}}or{{TAB}}{ans}{mark}{tab_right}")
                else:
                    output.append(f"{{TAB}}{{TAB}}{{TAB}}{ans}{mark}{tab_right}")

        if extra_info:
            output.append(f"{{TAB}}{{TAB}}{{TAB}}{{BOLD}}Extra information{{BOLD}}")
            for info in extra_info:
                output.append(f"{{TAB}}{{TAB}}{{TAB}}-{{TAB}}{info}")

        output.append("")

    if current_major:
        output.append(f"{{ALIGN RIGHT}}{{BOLD}}Total Question {int(current_major)}: {major_total} marks{{BOLD}}{{ALIGN RIGHT}}")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(output))

if __name__ == "__main__":
    input_dir = r"C:\Users\Lam\Desktop\SzeMan\data\txts\Physics1F"
    output_dir = r"C:\Users\Lam\Desktop\SzeMan\data\outputs\txt_marked"

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.endswith(".txt"):
            print(f"Processing {filename}...")
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            parse_ms(input_path, output_path)

    print("All Physics 1F files converted to marked format.")
