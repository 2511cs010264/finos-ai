package com.finos.repository;

import com.finos.entity.GovtAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GovtAlertRepository extends JpaRepository<GovtAlert, Long> {
    List<GovtAlert> findAllByOrderByDateDesc();
}
