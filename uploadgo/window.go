package main

import (
	"errors"
	"github.com/lxn/walk"
	. "github.com/lxn/walk/declarative"
	log "github.com/sirupsen/logrus"
	"os"
)

func (s *Server) Exit() {
	log.Info("退出程序")
	for _, jod := range s.Jods {
		jod.Stop()
	}
	os.Exit(0)
}

func (s *Server) CreatMainWindow() {
	if !s.close {
		return
	}
	s.MainWindow = nil //需要使用 declarative 包中的方法初始化界面元素

	win := MainWindow{
		AssignTo:   &s.MainWindow,
		Background: SolidColorBrush{Color: COLOR_WHITE},
		Title:      title,
		MinSize:    Size{Width: 300},
		Size:       Size{Width: 300, Height: 100},
		Layout:     VBox{},
		MenuItems: []MenuItem{
			Menu{
				Text: "设置",
				Items: []MenuItem{
					Separator{},
					Action{
						Text: "退出",
						OnTriggered: func() {
							s.Exit()
						},
					},
				},
			},
		},
		Children: []Widget{
			Composite{
				Layout: HBox{
					MarginsZero: true,
					SpacingZero: true,
				},
				Children: []Widget{
					LineEdit{
						AssignTo: &s.FileTE,
						Enabled:  false,
						Text:     s.Config.ReportDir,
						OnTextChanged: func() {
							s.Config.ReportDir = s.FileTE.Text()
						},
					},
					PushButton{
						Text: "选择",
						OnClicked: func() {
							if file, err := s.selectFile(); err != nil {
								log.Error(err.Error())
							} else {
								s.FileTE.SetText(file)
							}
						},
					},
				},
			},
			PushButton{Text: "保存设置", OnClicked: func() {
				if err := s.Config.SaveConfigFile(); err != nil {
					s.Notity(title, "设置保存失败:"+err.Error())
				} else {
					s.Notity(title, "保存成功，请重启软件生效!")
				}
			}},
			PushButton{Text: "文件扫描", OnClicked: func() {
				s.Scan()
			},
			},
			HSeparator{
				MaxSize: Size{Width: 1},
			},
		},
	}

	if icon, err := walk.Resources.Icon(iconPath); err == nil {

		win.Icon = icon
	} else {
		log.Info(err.Error())

	}

	err := win.Create()
	if err != nil {
		panic(err)
	}
	s.close = false
}

func (s *Server) Scan() {
	for _, jod := range s.Jods {
		jod.Scan()
	}
}

func (s *Server) OpenMainWindow() {
	if !s.close {
		return
	}
	s.CreatMainWindow()
	go s.MainWindow.Run()
	/*	s.MainWindow.AsFormBase().VisibleChanged().Attach(func() {
			log.Info("VisibleChanged")
		})
		s.MainWindow.AsFormBase().Disposing().Attach(func() {
			log.Info("Disposing")
		})
		s.MainWindow.AsFormBase().Starting().Attach(func() {
			log.Info("Starting")
		})
		s.MainWindow.AsFormBase().Starting().Attach(func() {
			log.Info("Starting")
		})*/
	s.MainWindow.AsFormBase().Closing().Attach(func(canceled *bool, reason walk.CloseReason) {
		log.Info("Closing")
		s.Notity(title, "已隐藏")
		s.close = true
	})
	/*	s.MainWindow.AsFormBase().Deactivating().Attach(func() {
			log.Info("Deactivating")
		})
		s.MainWindow.AsFormBase().SizeChanged().Attach(func() {
			log.Info("SizeChanged")
		})*/

}

func (s *Server) selectFile() (string, error) {
	fileDlg := new(walk.FileDialog)
	fileDlg.Title = "选择下载报表文件根目录"
	if open, err := fileDlg.ShowBrowseFolder(s.MainWindow); err != nil {
		return "", err
	} else if open {
		return fileDlg.FilePath, nil
	}
	return "", errors.New("文件夹选择错误")
}

func (s *Server) CreateNotifyWindow() {
	if s.NotifyWindow != nil {
		s.NotifyWindow.Close()
		s.NotifyWindow = nil
	}
	mw, err := walk.NewMainWindow()
	if err != nil {
		log.Fatal(err)
	}

	ni, err := walk.NewNotifyIcon(mw)
	if err != nil {
		log.Fatal(err)
	}

	icon, err := walk.Resources.Icon(iconPath)
	if err == nil {
		if err := ni.SetIcon(icon); err != nil {
			log.Fatal(err)
		}
	}

	if err := ni.SetToolTip(title); err != nil {
		log.Fatal(err)
	}
	ni.MouseDown().Attach(func(x, y int, button walk.MouseButton) {
		if button != walk.LeftButton {
			return
		}
		s.OpenMainWindow()
	})

	exitAction := walk.NewAction()
	if err := exitAction.SetText("退出"); err != nil {
		log.Fatal(err)
	}
	exitAction.Triggered().Attach(func() {

		s.Exit()
	})
	if err := ni.ContextMenu().Actions().Add(exitAction); err != nil {
		log.Fatal(err)
	}
	if err := ni.SetVisible(true); err != nil {
		log.Fatal(err)
	}
	s.NotifyWindow = mw
	s.Ni = ni
}

func (s *Server) OpenNotifyWindow() {
	s.CreateNotifyWindow()
	s.NotifyWindow.Run()
}

func (s *Server) Notity(title, info string) {
	if s.Ni == nil {
		return
	}
	s.Ni.ShowMessage(title, info)
}
