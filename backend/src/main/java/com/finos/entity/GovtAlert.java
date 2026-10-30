package com.finos.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "govt_alerts")
public class GovtAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category;
    private LocalDate date;
    private String severity; // "success", "warning", "info"

    @Column(length = 1000)
    private String summary;

    public GovtAlert() {}

    public GovtAlert(String title, String category, LocalDate date, String severity, String summary) {
        this.title = title;
        this.category = category;
        this.date = date;
        this.severity = severity;
        this.summary = summary;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
}
