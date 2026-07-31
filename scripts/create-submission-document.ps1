param(
  [Parameter(Mandatory = $true)]
  [string]$LiveUrl
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot "output"
$docxPath = Join-Path $outputDir "dina_seoudi_task_manager_assessment.docx"
$pdfPath = Join-Path $outputDir "dina_seoudi_task_manager_assessment.pdf"
$schemaPath = Join-Path $projectRoot "supabase\schema.sql"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
  $doc = $word.Documents.Add()
  $section = $doc.Sections.Item(1)
  $section.PageSetup.PageWidth = 612
  $section.PageSetup.PageHeight = 792
  $section.PageSetup.TopMargin = 72
  $section.PageSetup.BottomMargin = 72
  $section.PageSetup.LeftMargin = 72
  $section.PageSetup.RightMargin = 72
  $section.PageSetup.HeaderDistance = 35.4
  $section.PageSetup.FooterDistance = 35.4

  $normal = $doc.Styles.Item("Normal")
  $normal.Font.Name = "Calibri"
  $normal.Font.Size = 11
  $normal.Font.Color = 0x292524
  $normal.ParagraphFormat.SpaceAfter = 6
  $normal.ParagraphFormat.LineSpacingRule = 5
  $normal.ParagraphFormat.LineSpacing = 13.2

  $h1 = $doc.Styles.Item("Heading 1")
  $h1.Font.Name = "Calibri"
  $h1.Font.Size = 16
  $h1.Font.Bold = $true
  $h1.Font.Color = 0xB5742E
  $h1.ParagraphFormat.SpaceBefore = 16
  $h1.ParagraphFormat.SpaceAfter = 8
  $h1.ParagraphFormat.KeepWithNext = $true

  $h2 = $doc.Styles.Item("Heading 2")
  $h2.Font.Name = "Calibri"
  $h2.Font.Size = 13
  $h2.Font.Bold = $true
  $h2.Font.Color = 0xB5742E
  $h2.ParagraphFormat.SpaceBefore = 12
  $h2.ParagraphFormat.SpaceAfter = 6
  $h2.ParagraphFormat.KeepWithNext = $true

  $header = $section.Headers.Item(1).Range
  $header.Text = "NEXT PLAY GAMES  |  SOFTWARE DEVELOPMENT ASSESSMENT"
  $header.Font.Name = "Calibri"
  $header.Font.Size = 8
  $header.Font.Bold = $true
  $header.Font.Color = 0x64748B
  $header.ParagraphFormat.Alignment = 0

  $footer = $section.Footers.Item(1).Range
  $footer.Text = "Dina Seoudi  |  NextPlay Kanban  |  "
  $footer.Font.Name = "Calibri"
  $footer.Font.Size = 8
  $footer.Font.Color = 0x64748B
  $footer.ParagraphFormat.Alignment = 2
  $footer.Collapse(0)
  $footer.Fields.Add($footer, -1, "PAGE", $true) | Out-Null

  function Add-Paragraph {
    param(
      [string]$Text,
      [string]$Style = "Normal",
      [int]$After = -1,
      [bool]$Bold = $false,
      [int]$Color = -1
    )
    $p = $doc.Content.Paragraphs.Add()
    $p.Range.Text = $Text
    $p.Range.Style = $Style
    if ($After -ge 0) { $p.Format.SpaceAfter = $After }
    if ($Bold) { $p.Range.Font.Bold = $true }
    if ($Color -ge 0) { $p.Range.Font.Color = $Color }
    return $p
  }

  function Add-Bullet {
    param([string]$Text)
    $p = Add-Paragraph -Text $Text -After 8
    $p.Range.ListFormat.ApplyBulletDefault()
    $p.Format.LeftIndent = 36
    $p.Format.FirstLineIndent = -18
  }

  function Add-LinkRow {
    param([string]$Label, [string]$Url)
    $p = $doc.Content.Paragraphs.Add()
    $labelRange = $p.Range
    $labelRange.Text = "$Label: "
    $labelRange.Font.Bold = $true
    $labelRange.Collapse(0)
    $doc.Hyperlinks.Add($labelRange, $Url, $null, $null, $Url) | Out-Null
    $p.Format.SpaceAfter = 5
  }

  $kicker = Add-Paragraph -Text "INTERNSHIP ASSESSMENT" -After 4 -Bold $true -Color 0xD3D322
  $kicker.Range.Font.Size = 9
  $kicker.Range.Font.Spacing = 1.5

  $title = Add-Paragraph -Text "NextPlay Kanban" -After 4 -Bold $true -Color 0x45200B
  $title.Range.Font.Size = 28

  $subtitle = Add-Paragraph -Text "Full-Stack Task Board Submission" -After 18 -Color 0x475569
  $subtitle.Range.Font.Size = 15

  Add-Paragraph -Text "Candidate: Dina Seoudi" -After 2 -Bold $true | Out-Null
  Add-Paragraph -Text "Stack: React, TypeScript, Vite, Tailwind CSS, Supabase, Playwright" -After 2 | Out-Null
  Add-Paragraph -Text "Submission date: July 30, 2026" -After 14 | Out-Null

  Add-LinkRow -Label "Live frontend" -Url $LiveUrl
  Add-LinkRow -Label "GitHub repository" -Url "https://github.com/Dinasaur9/kanban-task-board"

  Add-Paragraph -Text "Solution overview" -Style "Heading 1" | Out-Null
  Add-Paragraph -Text "NextPlay Kanban is a responsive task board designed around a fast anonymous workflow. A guest session is created automatically, each task belongs to that authenticated guest, and Supabase Row Level Security prevents users from reading or changing another guest's records. The board remains usable when cloud configuration is unavailable through a clearly labeled device-local fallback." | Out-Null

  Add-Paragraph -Text "Design decisions" -Style "Heading 1" | Out-Null
  Add-Bullet -Text "A deep slate interface and cyan primary accent create a focused, professional visual system. Amber, violet, emerald, and red communicate workflow and urgency without competing with primary actions."
  Add-Bullet -Text "Strong spacing, rounded surfaces, compact badges, and clear typography establish hierarchy between summary information, columns, and task cards."
  Add-Bullet -Text "Native drag-and-drop keeps the required desktop interaction lightweight. Each card also has a status selector for keyboard and touch accessibility."
  Add-Bullet -Text "Optimistic updates make task changes immediate. If a Supabase mutation fails, the UI restores the previous state and presents an actionable error."

  Add-Paragraph -Text "Required functionality delivered" -Style "Heading 1" | Out-Null
  Add-Bullet -Text "Four default columns: To Do, In Progress, In Review, and Done."
  Add-Bullet -Text "Create, edit, drag, move, persist, and delete task workflows."
  Add-Bullet -Text "Automatic Supabase anonymous authentication and user-scoped queries."
  Add-Bullet -Text "Clear loading, empty, saving, and error states."
  Add-Bullet -Text "Responsive layouts for mobile, tablet, and desktop widths."

  Add-Paragraph -Text "Advanced features" -Style "Heading 1" | Out-Null
  Add-Bullet -Text "Due date indicators highlight tasks that are due soon or overdue."
  Add-Bullet -Text "Search filters task titles and descriptions in real time."
  Add-Bullet -Text "Priority filtering and automatic priority ordering keep urgent work visible."
  Add-Bullet -Text "Board summary cards show total, completed, in-progress, and overdue task counts."

  Add-Paragraph -Text "Local setup" -Style "Heading 1" | Out-Null
  Add-Paragraph -Text "1. Clone the GitHub repository and run npm install." | Out-Null
  Add-Paragraph -Text "2. Create a free Supabase project and enable anonymous sign-ins in Authentication settings." | Out-Null
  Add-Paragraph -Text "3. Run supabase/schema.sql in the Supabase SQL Editor." | Out-Null
  Add-Paragraph -Text "4. Copy .env.example to .env.local, then enter VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." | Out-Null
  Add-Paragraph -Text "5. Run npm run dev. Use npm run lint, npm run build, and npm run test:e2e for verification." | Out-Null

  $security = Add-Paragraph -Text "Security note: only the public Supabase anon key belongs in the frontend. The service-role key must never be committed or exposed." -After 10 -Bold $true -Color 0x1C1C9B
  $security.Shading.BackgroundPatternColor = 0xF4F6F9

  Add-Paragraph -Text "Tradeoffs and future improvements" -Style "Heading 1" | Out-Null
  Add-Bullet -Text "Native drag-and-drop avoids another dependency, but a specialized interaction library could add richer touch dragging and animated reordering within columns."
  Add-Bullet -Text "The device-local fallback is intentionally separate from cloud data and does not automatically merge into a later Supabase session."
  Add-Bullet -Text "With additional time, the next features would be assignees, comments, activity history, and custom labels."

  Add-Paragraph -Text "Verification" -Style "Heading 1" | Out-Null
  Add-Bullet -Text "TypeScript production build: passed."
  Add-Bullet -Text "ESLint code-quality check: passed with zero errors or warnings."
  Add-Bullet -Text "Playwright end-to-end workflow: passed in Microsoft Edge, covering create, edit, move, filter, reload persistence, and delete."

  $doc.Content.InsertBreak(7)
  Add-Paragraph -Text "Complete Supabase schema" -Style "Heading 1" | Out-Null
  Add-Paragraph -Text "The following SQL creates the required UUID-based tasks table, validation constraints, index, grants, and owner-only Row Level Security policies." -After 10 | Out-Null

  $schemaLines = Get-Content $schemaPath
  foreach ($line in $schemaLines) {
    $p = Add-Paragraph -Text $line -After 0
    $p.Range.Font.Name = "Consolas"
    $p.Range.Font.Size = 8
    $p.Format.LineSpacingRule = 0
    $p.Format.KeepTogether = $false
  }

  $doc.Repaginate()
  $doc.SaveAs2($docxPath, 16)
  $doc.ExportAsFixedFormat($pdfPath, 17)
  $doc.Close($false)
}
finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}

Write-Output $docxPath
Write-Output $pdfPath
