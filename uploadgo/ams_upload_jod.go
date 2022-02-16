package main

import (
	"bufio"
	"github.com/robfig/cron"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"os"
	"strings"
	"uploadgo/config"
	"uploadgo/upload"
)

const AMS_PATH = "AMSCampaigns"

type AmsUploadJod struct {
	Config *config.Config
	Upload upload.FileUploader
	c      *cron.Cron
}

func NewAmsUploadJod(cfg *config.Config, us upload.FileUploader) *AmsUploadJod {
	u := &AmsUploadJod{Config: cfg}
	c := cron.New()
	c.AddFunc(u.Config.Cron, u.Scan)
	u.c = c
	u.Upload = us
	return u
}

func (u *AmsUploadJod) Start() {
	log.Info("开始上传扫描")
	u.c.Start()
}

func (u *AmsUploadJod) Stop() {
	u.c.Stop()
}

func (u *AmsUploadJod) Scan() {
	path := u.Config.ReportDir + string(os.PathSeparator) + AMS_PATH
	stat, err := os.Stat(path)
	if os.IsNotExist(err) {
		log.Warn("上传文件目录不存在或者:", err.Error())
		return
	}
	if !stat.IsDir() {
		log.Warn("上传文件目录类型错误,请选择文件夹")
		return
	}

	accountSites, err := ioutil.ReadDir(path)
	if err != nil {
		log.Warn("上传文件目录读取错误", err.Error())
		return
	}

	for _, accountSite := range accountSites { // 可能有多个账号的数据
		if accountSite.IsDir() {
			tmp := accountSite.Name() // 一个文件夹表示一个账号的数据目录
			accountPath := path + config.PathSeparator + tmp
			log.Info("账号-站点：", tmp)
			csvFiles, _ := ioutil.ReadDir(accountPath) // 扫描 报表文件
			for _, file := range csvFiles {
				fileName := file.Name()
				if strings.HasSuffix(fileName, ".txt") {
					remoteFileName := tmp + FILE_NAME_SPACE + strings.ReplaceAll(fileName, ".txt", ".csv")
					filePath := path + config.PathSeparator + tmp + config.PathSeparator + fileName
					if u.validateFile(filePath) {
						newName := path + config.PathSeparator + tmp + config.PathSeparator + fileName + SUCCESS_FILE_END
						err := u.Upload.Upload(filePath, remoteFileName)
						if err != nil {
							log.Errorf("文件上传失败: %s  ----  %s", filePath, err.Error())
							continue
						}
						os.Rename(filePath, newName)
					} else {
						log.Warnf("文件格式错误：%s", filePath)
						newName := path + config.PathSeparator + tmp + config.PathSeparator + fileName + FAIL_FILE_END
						os.Rename(filePath, newName)
					}
				}
			}
		}
	}
}
func (u *AmsUploadJod) validateFile(file string) bool {
	csvFile, err := os.Open(file)
	if err != nil {
		return false
	}
	defer csvFile.Close()
	reader := bufio.NewReader(csvFile)
	line, _, err := reader.ReadLine()
	if err != nil {
		return false
	}
	log.Info(len(line))
	return len(line) > 0
}
