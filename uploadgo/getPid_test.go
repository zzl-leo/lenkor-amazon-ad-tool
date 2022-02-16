package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"regexp"
	"testing"
)

func Test_getPid(t *testing.T) {
	processName := "TeamViewer.exe"
	buf := bytes.Buffer{}
	cmd := exec.Command("wmic", "process", "get", "name,processid")
	cmd.Stdout = &buf
	cmd.Run()
	cmd2 := exec.Command("findstr", processName)
	cmd2.Stdin = &buf
	data, _ := cmd2.CombinedOutput()
	if len(data) == 0 {
		fmt.Println("not find")
	}
	info := string(data)
	//这里通过正则把进程id提取出来
	reg := regexp.MustCompile(`[0-9]+`)
	pid := reg.FindString(info)
	fmt.Println(pid)
}
