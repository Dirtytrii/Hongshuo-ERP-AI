package com.hongshuo.erp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * 系统配置文件读写服务。
 */
@Service
@RequiredArgsConstructor
public class ConfigFileService {

    @Value("${app.config.file:config.properties}")
    private String configFile;

    /**
     * 读取配置项。
     *
     * @param key 配置键
     * @param defaultValue 默认值
     * @return 配置值
     */
    public String get(String key, String defaultValue) {
        try {
            Properties props = loadConfig();
            return props.getProperty(key, defaultValue);
        } catch (IOException e) {
            return defaultValue;
        }
    }

    /**
     * 写入配置项。
     *
     * @param key 配置键
     * @param value 配置值
     */
    public void set(String key, String value) {
        try {
            Properties props = loadConfig();
            props.setProperty(key, value != null ? value : "");
            saveConfig(props);
        } catch (IOException e) {
            throw new RuntimeException("保存系统配置失败", e);
        }
    }

    /**
     * 读取完整配置。
     *
     * @return 配置对象
     */
    public Properties loadConfig() throws IOException {
        Properties props = new Properties();
        Path filePath = resolvePath();
        if (Files.exists(filePath)) {
            try (InputStream is = Files.newInputStream(filePath)) {
                props.load(is);
            }
        }
        return props;
    }

    private void saveConfig(Properties props) throws IOException {
        Path filePath = resolvePath();
        if (filePath.getParent() != null) {
            Files.createDirectories(filePath.getParent());
        }
        try (OutputStream os = Files.newOutputStream(filePath)) {
            props.store(os, "System Configuration");
        }
    }

    private Path resolvePath() {
        if (configFile.startsWith("/") || configFile.contains(":")) {
            return Paths.get(configFile);
        }
        String projectRoot = System.getProperty("user.dir");
        return Paths.get(projectRoot, "data", configFile);
    }
}
