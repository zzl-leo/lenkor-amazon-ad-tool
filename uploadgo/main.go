package main

import (
	"github.com/lxn/walk"
	log "github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
	"os"
	"uploadgo/config"
	"uploadgo/upload"
)

const (
	title    string = "Lenkor报表上传器v1.0.0"
	iconPath string = "./icon.ico"
)

var (
	COLOR_WHITE walk.Color
)

type UploadJoder interface {
	Start()
	Stop()
	Scan()
}

type Server struct {
	MainWindow   *walk.MainWindow
	FileTE       *walk.LineEdit
	Config       *config.Config
	NotifyWindow *walk.MainWindow
	Jods         []UploadJoder
	close        bool
	Ni           *walk.NotifyIcon
}

func init() {
	customFormatter := new(log.TextFormatter)
	customFormatter.FullTimestamp = true                    // 显示完整时间
	customFormatter.TimestampFormat = "2006-01-02 15:04:05" // 时间格式
	customFormatter.DisableTimestamp = false                // 禁止显示时间
	customFormatter.DisableColors = false                   // 禁止颜色显示
	log.SetFormatter(customFormatter)
	log.SetLevel(log.DebugLevel)
	log.SetOutput(&lumberjack.Logger{
		Filename:   "." + config.PathSeparator + "log" + config.PathSeparator + "log.log",
		MaxSize:    500, // megabytes
		MaxBackups: 3,
		MaxAge:     28, //days
	})
	if toolMode == debugCode {
		log.SetOutput(os.Stdout)
	}
	COLOR_WHITE = walk.RGB(255, 255, 255)
}

func main() {
	log.Info("项目启动....")
	cfg := config.LoadConfig()
	amsOssUpload, err := upload.CreateAmsAliYunOssUpload(cfg)
	if err != nil {
		log.Error("初始化上传程序错误", err.Error())
		return
	}
	bsOssUpload, err := upload.CreateBsAliYunOssUpload(cfg)
	if err != nil {
		log.Error("初始化上传程序错误", err.Error())
		return
	}

	server := WebServer{BrUpload: bsOssUpload, AmsUpload: amsOssUpload}
	go server.StartListen()

	amsUploadJod := NewAmsUploadJod(cfg, amsOssUpload)
	bsUploadJod := NewBsUploadJod(cfg, bsOssUpload)

	jods := []UploadJoder{
		amsUploadJod, bsUploadJod,
	}

	s := &Server{
		Config: cfg,
		Jods:   jods,
		close:  true,
	}

	/*	for _, jod := range s.Jods {
		jod.Start()
	}*/
	s.OpenMainWindow()
	s.OpenNotifyWindow()
}
