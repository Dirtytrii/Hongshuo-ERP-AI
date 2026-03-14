package com.hongshuo.erp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hongshuo.erp.model.InventoryItem;
import com.hongshuo.erp.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InventoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryService inventoryService;

    @Test
    void getAllInventory_returnsList() throws Exception {
        InventoryItem item = createItem(1L, "水泥", "42.5R", "吨", 10);
        when(inventoryService.getAllInventory()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("水泥"))
                .andExpect(jsonPath("$[0].spec").value("42.5R"))
                .andExpect(jsonPath("$[0].quantity").value(10));
    }

    @Test
    void getInventoryById_whenExists_returns200() throws Exception {
        InventoryItem item = createItem(1L, "水泥", "42.5R", "吨", 10);
        when(inventoryService.getInventoryById(1L)).thenReturn(Optional.of(item));

        mockMvc.perform(get("/api/inventory/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("水泥"));
    }

    @Test
    void getInventoryById_whenNotExists_returns404() throws Exception {
        when(inventoryService.getInventoryById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/inventory/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createInventoryItem_returns201() throws Exception {
        InventoryItem input = createItem(null, "钢筋", "HRB400", "吨", 0);
        InventoryItem saved = createItem(1L, "钢筋", "HRB400", "吨", 0);
        when(inventoryService.createInventoryItem(any(InventoryItem.class))).thenReturn(saved);

        mockMvc.perform(post("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("钢筋"));
    }

    @Test
    void updateInventoryItem_whenExists_returns200() throws Exception {
        InventoryItem updated = createItem(1L, "水泥更新", "42.5R", "吨", 20);
        when(inventoryService.updateInventoryItem(eq(1L), any(InventoryItem.class))).thenReturn(updated);

        mockMvc.perform(put("/api/inventory/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("水泥更新"))
                .andExpect(jsonPath("$.quantity").value(20));
    }

    @Test
    void updateInventoryItem_whenNotExists_returns404() throws Exception {
        InventoryItem body = createItem(1L, "x", "s", "个", 0);
        when(inventoryService.updateInventoryItem(eq(999L), any(InventoryItem.class)))
                .thenThrow(new RuntimeException("物料不存在"));

        mockMvc.perform(put("/api/inventory/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteInventoryItem_returns204() throws Exception {
        mockMvc.perform(delete("/api/inventory/1"))
                .andExpect(status().isNoContent());
        verify(inventoryService).deleteInventoryItem(1L);
    }

    @Test
    void deleteInventoryItem_whenNotExists_returns404() throws Exception {
        org.mockito.Mockito.doThrow(new RuntimeException("物料不存在"))
                .when(inventoryService).deleteInventoryItem(999L);

        mockMvc.perform(delete("/api/inventory/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getLowStockItems_returnsList() throws Exception {
        InventoryItem low = createItem(1L, "水泥", "42.5R", "吨", 5);
        low.setThreshold(10);
        when(inventoryService.getLowStockItems()).thenReturn(List.of(low));

        mockMvc.perform(get("/api/inventory/low-stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].quantity").value(5))
                .andExpect(jsonPath("$[0].threshold").value(10));
    }

    private static InventoryItem createItem(Long id, String name, String spec, String unit, int qty) {
        InventoryItem item = new InventoryItem();
        if (id != null) item.setId(id);
        item.setName(name);
        item.setSpec(spec);
        item.setUnit(unit);
        item.setPrice(BigDecimal.valueOf(500));
        item.setQuantity(qty);
        item.setThreshold(10);
        return item;
    }

}
