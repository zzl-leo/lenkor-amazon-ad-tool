package main

import (
	"github.com/gin-gonic/gin"
	"github.com/lxn/walk"
	log "github.com/sirupsen/logrus"
	"net/http"
	"os"
	"strings"
	"uploadgo/config"
	"uploadgo/upload"
)

type fileNotify struct {
	fileType string `json:"file_type"`
	filePath string `json:"file_path"`
}

type WebServer struct {
	BrUpload  upload.FileUploader
	AmsUpload upload.FileUploader
}

func (w *WebServer) StartListen() {
	engine := gin.Default()
	engine.POST("/report/file/notify", w.receiveFileNotify)
	err := engine.Run(":58080")
	if err != nil {
		walk.MsgBox(nil, title, "软件启动失败,请忽重复运行！", walk.MsgBoxOK)
		log.Error("启动失败：", err.Error())
		os.Exit(1)
	}
}

func (w *WebServer) receiveFileNotify(c *gin.Context) {
	var notify fileNotify
	if err := c.ShouldBindJSON(&notify); err != nil {
		c.JSON(http.StatusBadRequest, w.errorBody("错误的请求格式"))
		return
	}
	switch notify.fileType {
	case "BusinessReport":
		w.BrUpload.Upload(notify.filePath, remoteNameFormPath(notify.filePath))
	case "AMSCampaigns":
		w.AmsUpload.Upload(notify.filePath, remoteNameFormPath(notify.filePath))
	}
	c.JSON(http.StatusOK, w.successBody())
}

func remoteNameFormPath(localPath string) string {
	split := strings.Split(localPath, config.PathSeparator)
	lenth := len(split)
	accountSite := split[lenth-2]
	fileName := split[lenth-1]
	fileName = strings.ReplaceAll(fileName, ".txt", ".csv")
	return accountSite + "--" + fileName
}

func (w *WebServer) errorBody(msg string) gin.H {
	return gin.H{"code": -1, "msg": msg}
}

func (w *WebServer) successBody() gin.H {
	return gin.H{"code": 0, "msg": "成功"}
}
