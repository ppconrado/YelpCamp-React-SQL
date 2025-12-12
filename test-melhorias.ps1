# Script de Teste das Melhorias do Backend
# Execute este arquivo com: .\test-melhorias.ps1

Write-Host "`n🧪 TESTE DAS MELHORIAS DO BACKEND`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# Função auxiliar para fazer requisições
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    Write-Host "`n📝 TESTE: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url"
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        Write-Host "Resposta: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message
        
        if ($statusCode) {
            Write-Host "⚠️  Status: $statusCode" -ForegroundColor Red
        }
        
        if ($errorBody) {
            Write-Host "Mensagem: $errorBody" -ForegroundColor Red
        } else {
            Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

Write-Host "Certifique-se de que o servidor está rodando em http://localhost:3000" -ForegroundColor Cyan
Write-Host "Pressione ENTER para continuar ou Ctrl+C para cancelar..."
Read-Host

# TESTE 1: Listar campgrounds (testa logging)
Test-Endpoint -Name "Logging - Listar Campgrounds" `
              -Url "$baseUrl/campgrounds"

# TESTE 2: Senha muito curta
Test-Endpoint -Name "Validação - Senha muito curta (6 chars)" `
              -Url "$baseUrl/register" `
              -Method "POST" `
              -Body @{
                  username = "teste_curta"
                  email = "curta@test.com"
                  password = "abc123"
              }

# TESTE 3: Senha sem maiúscula
Test-Endpoint -Name "Validação - Senha sem maiúscula" `
              -Url "$baseUrl/register" `
              -Method "POST" `
              -Body @{
                  username = "teste_minusc"
                  email = "minusc@test.com"
                  password = "senhafraca123"
              }

# TESTE 4: Senha sem número
Test-Endpoint -Name "Validação - Senha sem número" `
              -Url "$baseUrl/register" `
              -Method "POST" `
              -Body @{
                  username = "teste_semnum"
                  email = "semnum@test.com"
                  password = "SenhaFraca"
              }

# TESTE 5: Senha FORTE (deve funcionar)
$randomId = Get-Random -Maximum 9999
Test-Endpoint -Name "Validação - Senha FORTE (deve funcionar)" `
              -Url "$baseUrl/register" `
              -Method "POST" `
              -Body @{
                  username = "usuario_teste_$randomId"
                  email = "teste_$randomId@test.com"
                  password = "SenhaForte123"
              }

# TESTE 6: Rate Limiting (tentar registrar 6 vezes seguidas)
Write-Host "`n📝 TESTE: Rate Limiting - 6 tentativas de registro" -ForegroundColor Yellow
Write-Host "Esperado: As primeiras 5 devem falhar (senha fraca), a 6ª deve ser bloqueada por rate limit`n"

for ($i = 1; $i -le 6; $i++) {
    Write-Host "Tentativa $i de 6..." -ForegroundColor Cyan
    
    Test-Endpoint -Name "Tentativa $i" `
                  -Url "$baseUrl/register" `
                  -Method "POST" `
                  -Body @{
                      username = "rate_test_$i"
                      email = "rate_$i@test.com"
                      password = "123"  # senha fraca de propósito
                  } | Out-Null
    
    Start-Sleep -Milliseconds 500
}

# TESTE 7: Rota inexistente (testa tratamento de erros)
Test-Endpoint -Name "Erro - Rota inexistente" `
              -Url "$baseUrl/rota-que-nao-existe"

Write-Host "`n✅ TESTES CONCLUÍDOS!`n" -ForegroundColor Green
Write-Host "Verifique também o console do servidor para ver:" -ForegroundColor Cyan
Write-Host "  - Logs coloridos do Morgan (requisições HTTP)" -ForegroundColor Gray
Write-Host "  - Mensagens de validação" -ForegroundColor Gray
Write-Host "`nPara testar o Graceful Shutdown:" -ForegroundColor Cyan
Write-Host "  - Vá ao terminal do servidor e pressione Ctrl+C" -ForegroundColor Gray
Write-Host "  - Você deve ver as mensagens de encerramento limpo" -ForegroundColor Gray
