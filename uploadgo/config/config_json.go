package config

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
	"reflect"
	"strings"

	log "github.com/sirupsen/logrus"
)

const PathSeparator = string(os.PathSeparator)
const configPath = "." + PathSeparator + "config.json"
const SettingVersion = "v1.0.0"

type (
	yamlMap map[string]interface{}
	Config  struct {
		Version     string `json:"version"`
		ReportDir   string `json:"ReportDir"`   //报表下载的根路径
		Enable      bool   `json:"Enable"`      // 是否启动扫描
		Cron        string `json:"Cron"`        // 扫描间隔 秒
		RemoteArr   string `json:"RemoteArr"`   // 远程地址
		HideOnClose bool   `json:"HideOnClose"` // 关闭时隐藏
		cMap        yamlMap
	}
)

func LoadConfig() *Config {
	var Config *Config
	if !fileExists(configPath) {
		Config = createDefaultConfig()
		Config.saveDefaultConfig()
		return Config
	}
	yamlFile, err := ioutil.ReadFile(configPath)
	if err != nil {
		log.Error("json file  read  err:", err.Error())
		panic(err)
	}

	if err := json.Unmarshal(yamlFile, &Config); err != nil {
		log.Error("json file decode err:", err.Error())
		panic(err)
	}

	if err := json.Unmarshal(yamlFile, &(Config.cMap)); err != nil {
		log.Error("json file decode err:", err.Error())
		panic(err)
	}

	return Config
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	if err == nil {
		return true
	}
	return false
}

func createDefaultConfig() *Config {
	getwd, _ := os.Getwd()
	Config := &Config{
		Version:     SettingVersion,
		ReportDir:   getwd,
		Enable:      true,
		Cron:        "0 0/5 * * * *",
		HideOnClose: true,
		RemoteArr:   "",
		cMap:        make(map[string]interface{})}
	return Config
}

func (c *Config) saveDefaultConfig() {
	bs, _ := json.MarshalIndent(c, "", " ")
	ioutil.WriteFile(configPath, bs, os.ModePerm)
}

func (c *Config) SaveConfigFile() error {
	object := reflect.ValueOf(c)
	myref := object.Elem()
	typeOfType := myref.Type()
	for i := 0; i < myref.NumField(); i++ {
		field := myref.Field(i)
		if field.CanInterface() && len(typeOfType.Field(i).Tag.Get("json")) > 0 {
			c.cMap[typeOfType.Field(i).Name] = field.Interface()
		}
	}
	bs, _ := json.MarshalIndent(c.cMap, "", " ")
	err := ioutil.WriteFile(configPath, bs, os.ModePerm)

	return err
}

func (c *Config) GetStringDefault(key, defalut string) string {
	if result, err := c.cMap.get(key); err == nil && result != nil {
		return result.(string)
	} else {
		return defalut
	}
}

func (c *Config) GetString(key string) (string, error) {
	if result, err := c.cMap.get(key); err == nil && result != nil {
		return result.(string), nil
	} else {
		return "", err
	}
}
func (c *Config) GetInt(key string) (int, error) {
	if result, err := c.cMap.get(key); err == nil && result != nil {
		return result.(int), nil
	} else {
		return 0, err
	}
}

func (c *Config) Set(key string, val interface{}) {
	keys := strings.Split(key, ".")
	pre := c.cMap
	for len(keys) > 1 {
		get, err := pre.get(keys[0])
		if err != nil {
			pre[keys[0]] = make(map[string]interface{})
		} else {
			keys = keys[1:]
			pre = get.(yamlMap)
			if len(keys) == 1 {
				pre[keys[0]] = val
				return
			}
		}
	}
}

func (c *yamlMap) get(key string) (interface{}, error) {
	keys := strings.Split(key, ".")
	if m, ok := (*c)[keys[0]]; !ok {
		log.Warn("key not found : " + key)
		return nil, errors.New("key not found : " + key)
	} else {
		keys = keys[1:]
		if len(keys) != 0 {
			if v, ok := m.(map[string]interface{}); ok {
				y := yamlMap(v)
				return y.get(strings.Join(keys, "."))
			} else {
				log.Warn("key not found : " + key)
				return nil, errors.New("key not found : " + key)
			}
		}
		return m, nil
	}
}
