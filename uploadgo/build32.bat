set GOARCH=386
set GIN_MODE=release
set TOOL_MODE=release
go build -o="Lenkor报表上传器.exe" -ldflags="-H windowsgui"