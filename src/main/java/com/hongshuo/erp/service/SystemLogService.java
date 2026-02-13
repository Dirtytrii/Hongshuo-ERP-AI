package com.hongshuo.erp.service;

import com.hongshuo.erp.model.SystemLog;
import com.hongshuo.erp.repository.SystemLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SystemLogService {
    
    @Autowired
    private SystemLogRepository systemLogRepository;
    
    public List<SystemLog> getAllLogs() {
        return systemLogRepository.findAll();
    }
    
    public List<SystemLog> getLogsByUser(String user) {
        return systemLogRepository.findByUser(user);
    }
    
    public List<SystemLog> getLogsByAction(String action) {
        return systemLogRepository.findByAction(action);
    }
}

