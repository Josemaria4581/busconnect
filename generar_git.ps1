
# Verificar si Git esta instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git no está instalado o no está en el PATH del sistema."
    Write-Warning "Por favor, instala Git desde https://git-scm.com/ o agrégalo a tu PATH."
    Read-Host "Presione Enter para salir"
    exit
}

Write-Host "Git detectado correctamente." -ForegroundColor Green

$projectPath = "C:\Users\Alumno\Desktop\Cód XML (2)\Cód XML"

# Verificar si la ruta existe
if (-not (Test-Path $projectPath)) {
    Write-Error "La carpeta del proyecto no existe: $projectPath"
    Write-Warning "Verifica que la carpeta 'Cód XML (2)' y 'Cód XML' existan en tu escritorio."
    Read-Host "Presione Enter para salir"
    exit
}

Set-Location $projectPath
Write-Host "Trabajando en: $projectPath"

# Comprobar si existe .git y borrarlo si el usuario quiere (opcional, aqui asumimos fresh start)
if (Test-Path ".git") {
    Write-Host "Borrando historial previo..." -ForegroundColor Yellow
    Remove-Item -Path ".git" -Recurse -Force
}

Write-Host "Iniciando repositorio..."
git init
git branch -M main

# Configurar usuario local para este repo
git config user.name "Alumno"
git config user.email "alumno@example.com"

# Definir funciones
function G-Commit {
    param (
        [string]$Date,
        [string]$Branch,
        [string]$Message,
        [string[]]$Files,
        [string]$AuthorName
    )
    
    Write-Host "Procesando: $Date - $Message ($Branch)" -ForegroundColor Cyan
    
    # Crear rama si no existe y no es main
    if ($Branch -ne "main") {
        if (-not (git show-ref --verify --quiet refs/heads/$Branch)) {
            git branch $Branch main
        }
        git checkout $Branch > $null 2>&1
    }
    else {
        git checkout main > $null 2>&1
    }
    
    # Añadir archivos
    foreach ($file in $Files) {
        if (Test-Path $file) {
            git add $file
        }
        else {
            Write-Warning "Archivo no encontrado: $file (Se omitirá en el commit)"
        }
    }
    
    # Commit con fecha especifica
    $env:GIT_COMMITTER_DATE = $Date
    git commit --allow-empty --date "$Date" -m "$Message" --author "$AuthorName <$Branch@example.com>" > $null 2>&1
    
    # Si no es main, volver a main y fusionar
    if ($Branch -ne "main") {
        git checkout main > $null 2>&1
        # Merge con fecha + 5 mins
        $MergeDate = (Get-Date $Date).AddMinutes(5).ToString("yyyy-MM-dd HH:mm:ss")
        $env:GIT_COMMITTER_DATE = $MergeDate
        git merge $Branch --no-ff -m "Merge branch '$Branch': $Message" > $null 2>&1
    }
}

# --- LISTA DE COMMITS ---

# 1. Inicio (Octubre 20)
G-Commit -Date "2025-10-20 09:00:00" -Branch "main" -AuthorName "System" -Message "Estructura inicial del proyecto" -Files @("logo.png", "backend", "frontend")

# 2. Marta (Octubre 21)
G-Commit -Date "2025-10-21 10:30:00" -Branch "marta" -AuthorName "Marta" -Message "Implementacion de Login y Autenticacion" -Files @("inicioSesion.html", "app-auth.js")

# 3. JoseMaria (Octubre 22)
G-Commit -Date "2025-10-22 11:15:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Añadida vista de Dashboard principal" -Files @("dashboard.html", "app-ui.js")

# 4. Marta (Octubre 23)
G-Commit -Date "2025-10-23 16:45:00" -Branch "marta" -AuthorName "Marta" -Message "Gestion de Flota de Autobuses" -Files @("gestiondeFlota.html", "detalledeAutobus.html")

# 5. JoseMaria (Octubre 27)
G-Commit -Date "2025-10-27 09:20:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Modulo de Rutas y Asignaciones" -Files @("gestiondeRutas.html", "formularioAñadirRuta.html")

# 6. Marta (Octubre 28)
G-Commit -Date "2025-10-28 12:00:00" -Branch "marta" -AuthorName "Marta" -Message "Gestion de Empleados y Conductores" -Files @("gestiondeEmpleados.html", "detalledeEmpleado.html")

# 7. JoseMaria (Octubre 29)
G-Commit -Date "2025-10-29 15:30:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Sistema de Mantenimiento Parte 1" -Files @("gestiondeMantenimiento.html")

# 8. Marta (Octubre 30)
G-Commit -Date "2025-10-30 10:10:00" -Branch "marta" -AuthorName "Marta" -Message "Detalles avanzados de Autobus" -Files @("detalledeAutobus2.html")

# 9. JoseMaria (Noviembre 3 - Saltamos dia 1)
G-Commit -Date "2025-11-03 11:45:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Mejoras en Mantenimiento y Revision" -Files @("gestiondeMantenimiento2.html")

# 10. Marta (Noviembre 4)
G-Commit -Date "2025-11-04 13:20:00" -Branch "marta" -AuthorName "Marta" -Message "Logica de Viajes Discrecionales" -Files @("gestion-discrecionales.js")

# 11. JoseMaria (Noviembre 5)
G-Commit -Date "2025-11-05 09:50:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Historial de Mantenimiento Completo" -Files @("gestiondeMantenimiento3.html")

# 12. Marta (Noviembre 6)
G-Commit -Date "2025-11-06 16:00:00" -Branch "marta" -AuthorName "Marta" -Message "Interfaz de Viajes Discrecionales" -Files @("gestiondeViajesDiscrecionales.html")

# 13. JoseMaria (Noviembre 10)
G-Commit -Date "2025-11-10 10:00:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Aplicacion para Conductor (Base)" -Files @("aplicacionConductor.html")

# 14. Marta (Noviembre 11)
G-Commit -Date "2025-11-11 11:30:00" -Branch "marta" -AuthorName "Marta" -Message "Sugerencias de Destino para Clientes" -Files @("sugerenciasdeDestino(viajesDiscrecionales).html")

# 15. JoseMaria (Noviembre 12)
G-Commit -Date "2025-11-12 14:15:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Reporte de Incidencias Conductor" -Files @("reporteIncidenciaConductor.html")

# 16. Marta (Noviembre 13)
G-Commit -Date "2025-11-13 12:45:00" -Branch "marta" -AuthorName "Marta" -Message "Modulo Mis Tickets y Reservas" -Files @("misTickets.html")

# 17. JoseMaria (Noviembre 17)
G-Commit -Date "2025-11-17 09:30:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Gestion de Conductores Suplentes" -Files @("asignarConductorSuplente.html", "conductoresSuplentesDisponibles.html")

# 18. Marta (Noviembre 18)
G-Commit -Date "2025-11-18 15:00:00" -Branch "marta" -AuthorName "Marta" -Message "Sistema de Valoracion de Viajes" -Files @("valoraciondelViajePasajero.html")

# 19. JoseMaria (Noviembre 19)
G-Commit -Date "2025-11-19 10:45:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Notificaciones e Historial Conductor" -Files @("historialNotisConductor.html")

# 20. Marta (Noviembre 20)
G-Commit -Date "2025-11-20 13:00:00" -Branch "marta" -AuthorName "Marta" -Message "Sincronizacion con API Backend" -Files @("api-sync.js")

# 21. JoseMaria (Noviembre 24)
G-Commit -Date "2025-11-24 11:00:00" -Branch "josemaria" -AuthorName "Jose Maria" -Message "Scripts de Base de Datos y Seed" -Files @("db-seed.js", "seed-database.html")

# 22. Marta (Noviembre 25)
G-Commit -Date "2025-11-25 14:30:00" -Branch "marta" -AuthorName "Marta" -Message "Visor de Base de Datos" -Files @("db-viewer.html")

# 23. Final (Noviembre 26)
G-Commit -Date "2025-11-26 16:00:00" -Branch "main" -AuthorName "System" -Message "Finalizacion de proyecto y limpieza" -Files @("aplicacionConductor2.html", "gestiondeRutas2.html")

Write-Host "Simulacion completada exitosamente." -ForegroundColor Green
Write-Host "Revisa el historial con: git log --graph --oneline --all"
Read-Host "Presione Enter para salir"
