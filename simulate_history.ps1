# Configuración
$StartDate = Get-Date "2025-10-20"
$EndDate = Get-Date "2026-02-11"
# Configuración
$StartDate = Get-Date "2025-10-20"
$EndDate = Get-Date "2026-02-11"
$ProjectRoot = Get-Location

# Intentar arreglar PATH para Git si no existe
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $PossibleGitPaths = @(
        "C:\Program Files\Git\cmd",
        "C:\Program Files\Git\bin",
        "$env:LOCALAPPDATA\Programs\Git\cmd"
    )
    foreach ($path in $PossibleGitPaths) {
        if (Test-Path "$path\git.exe") {
            Write-Host "Git detectado en: $path. Añadiendo al PATH..." -ForegroundColor Cyan
            $env:Path += ";$path"
            break
        }
    }
}

$Holidays = @(
    "2025-11-01", # Todos los Santos
    "2025-12-06", # Constitución
    "2025-12-08", # Inmaculada
    "2026-02-28"  # Día de Andalucía
)

# Vacaciones de Navidad (23 Dic - 7 Enero)
$ChristmasStart = Get-Date "2025-12-23"
$ChristmasEnd = Get-Date "2026-01-07"

# Semana Blanca / Día Comunidad Educativa (aprox 27 Feb)
$SemanaBlanca = Get-Date "2026-02-27"

Set-Location $ProjectRoot

# 1. Limpieza e Inicialización
Write-Host "Limpiando repositorio anterior..." -ForegroundColor Yellow
if (Test-Path ".git") { Remove-Item ".git" -Recurse -Force }
git init
git branch -M main
git config user.name "Alumno"
git config user.email "alumno@centro.edu"

# 2. Obtener todos los archivos (excluyendo git, node_modules, dist)
$AllFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.FullName -notmatch "\\.git\\" -and 
    $_.FullName -notmatch "\\node_modules\\" -and 
    $_.FullName -notmatch "\\dist\\" -and
    $_.Name -ne "simulate_history.ps1" -and
    $_.Name -ne "generar_git.ps1"
}

# 3. Agrupar archivos lógicamente
$CoreFiles = $AllFiles | Where-Object { $_.Name -match "package|vite|index.html|app.js|auth" }
$BackendFiles = $AllFiles | Where-Object { $_.FullName -match "\\backend\\" }
$ComponentFiles = $AllFiles | Where-Object { $_.FullName -match "\\components\\" }
$PageFiles = $AllFiles | Where-Object { $_.FullName -match "\\pages\\" }
$LegacyFiles = $AllFiles | Where-Object { $_.Extension -eq ".html" -or $_.Name -match "legacy" }
$OtherFiles = $AllFiles | Where-Object { 
    $CoreFiles.FullName -notcontains $_.FullName -and 
    $BackendFiles.FullName -notcontains $_.FullName -and 
    $ComponentFiles.FullName -notcontains $_.FullName -and 
    $PageFiles.FullName -notcontains $_.FullName -and 
    $LegacyFiles.FullName -notcontains $_.FullName
}

# Cola de archivos para commitear
$FileQueue = New-Object System.Collections.ArrayList
$FileQueue.AddRange($CoreFiles)
$FileQueue.AddRange($BackendFiles)
$FileQueue.AddRange($LegacyFiles)
$FileQueue.AddRange($ComponentFiles)
$FileQueue.AddRange($PageFiles)
$FileQueue.AddRange($OtherFiles)

$TotalFiles = $FileQueue.Count
Write-Host "Total de archivos a procesar: $TotalFiles" -ForegroundColor Cyan

# 4. Generar lista de días laborables
$WorkDays = New-Object System.Collections.ArrayList
$Current = $StartDate

while ($Current -le $EndDate) {
    # Evitar fines de semana
    if ($Current.DayOfWeek -ne "Saturday" -and $Current.DayOfWeek -ne "Sunday") {
        $IsHoliday = $false
        
        # Chequear festivos fijos
        $DayString = $Current.ToString("yyyy-MM-dd")
        if ($Holidays -contains $DayString) { $IsHoliday = $true }
        
        # Chequear Navidad
        if ($Current -ge $ChristmasStart -and $Current -le $ChristmasEnd) { $IsHoliday = $true }

        # Chequear Semana Blanca
        if ($Current.Date -eq $SemanaBlanca.Date) { $IsHoliday = $true }

        if (-not $IsHoliday) {
            [void]$WorkDays.Add($Current)
        }
    }
    $Current = $Current.AddDays(1)
}

$TotalWorkDays = $WorkDays.Count
Write-Host "Días laborables disponibles: $TotalWorkDays" -ForegroundColor Cyan

# 5. Calcular archivos por día (aproximado)
if ($TotalWorkDays -eq 0) { Write-Error "No hay días laborables!"; exit }
$FilesPerDay = [Math]::Ceiling($TotalFiles / $TotalWorkDays)
Write-Host "Archivos por commit (aprox): $FilesPerDay" -ForegroundColor Cyan

# 6. Bucle Principal
$Authors = @("Marta", "JoseMaria")
$Branches = @("marta", "josemaria")
$AuthorIndex = 0
$FileIndex = 0

foreach ($Day in $WorkDays) {
    if ($FileIndex -ge $TotalFiles) { break }
    
    # Seleccionar Autor y Rama para este día
    $Author = $Authors[$AuthorIndex % 2]
    $Branch = $Branches[$AuthorIndex % 2]
    $AuthorIndex++

    # Seleccionar lote de archivos
    $BatchFiles = New-Object System.Collections.ArrayList
    
    # Tomamos un número variable de archivos para que no sea tan robótico (entre 1 y FilesPerDay*2)
    $BatchSize = Get-Random -Minimum 1 -Maximum ([int]$FilesPerDay + 2)
    
    for ($i = 0; $i -lt $BatchSize; $i++) {
        if (($FileIndex + $i) -lt $TotalFiles) {
            [void]$BatchFiles.Add($FileQueue[$FileIndex + $i])
        }
    }
    
    if ($BatchFiles.Count -eq 0) { break }
    
    $FileIndex += $BatchFiles.Count

    # --- EJECUTAR GIT ---
    $DateStr = $Day.ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "[$DateStr] Rama: $Branch - Archivos: $($BatchFiles.Count)" -ForegroundColor Green

    # 1. Checkout Rama Feature
    # Si la rama no existe, la creamos desde main
    git rev-parse --verify $Branch > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        git checkout -b $Branch main > $null 2>&1
    }
    else {
        git checkout $Branch > $null 2>&1
    }

    # 2. Añadir archivos
    foreach ($file in $BatchFiles) {
        git add "$($file.FullName)"
    }

    # 3. Commit en Feature
    $env:GIT_COMMITTER_DATE = $DateStr
    $env:GIT_AUTHOR_DATE = $DateStr
    $Msg = "Avance del proyecto: $($BatchFiles[0].Name) y otros"
    git commit -m "$Msg" --author "$Author <$Branch@escuela.es>" > $null 2>&1

    # 4. Volver a Main y Merge
    git checkout main > $null 2>&1
    
    # Merge Date un poco después
    $MergeDate = $Day.AddMinutes(30).ToString("yyyy-MM-dd HH:mm:ss")
    $env:GIT_COMMITTER_DATE = $MergeDate
    $env:GIT_AUTHOR_DATE = $MergeDate
    
    git merge $Branch --no-ff -m "Merge branch '$Branch': Incorporando cambios de $Author" > $null 2>&1
}

# 7. Limpieza final
git checkout main
Write-Host "Historial generado exitosamente!!" -ForegroundColor Green
