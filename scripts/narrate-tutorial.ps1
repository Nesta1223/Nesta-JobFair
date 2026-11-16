$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$nestaRoot = Split-Path -Parent $PSScriptRoot
$nestaTutorial = Join-Path $nestaRoot 'artifacts/private/tutorial'
$nestaSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$nestaSynth.SelectVoice('Microsoft Zira Desktop')
$nestaSynth.Rate = 0
for ($nestaIndex = 0; $nestaIndex -lt 10; $nestaIndex++) {
    $nestaStem = 'voice-{0:D2}' -f $nestaIndex
    $nestaWave = Join-Path $nestaTutorial ($nestaStem + '.wav')
    $nestaSynth.SetOutputToWaveFile($nestaWave)
    $nestaSynth.Speak([System.IO.File]::ReadAllText((Join-Path $nestaTutorial ($nestaStem + '.txt'))))
    $nestaSynth.SetOutputToNull()
}
$nestaSynth.Dispose()
Write-Output 'Generated ten narrated segments.'
