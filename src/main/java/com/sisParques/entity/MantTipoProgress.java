package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_mant_tipo_progress", schema = "sc_sistema")
public class MantTipoProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mtp_id")
    private Integer mtpId;

    @Column(name = "mant_id", nullable = false)
    private Integer mantId;

    @Column(name = "tima_id", nullable = false)
    private Integer timaId;

    @Column(name = "mtp_completado")
    private Boolean mtpCompletado = false;

    @Column(name = "mtp_fecha_check")
    private LocalDateTime mtpFechaCheck;

    @Column(name = "mtp_usuario_id")
    private Integer mtpUsuarioId;

    // ── Getters & Setters ─────────────────────────────────────────────────────
    public Integer getMtpId() {
        return mtpId;
    }

    public void setMtpId(Integer v) {
        this.mtpId = v;
    }

    public Integer getMantId() {
        return mantId;
    }

    public void setMantId(Integer v) {
        this.mantId = v;
    }

    public Integer getTimaId() {
        return timaId;
    }

    public void setTimaId(Integer v) {
        this.timaId = v;
    }

    public Boolean getMtpCompletado() {
        return mtpCompletado;
    }

    public void setMtpCompletado(Boolean v) {
        this.mtpCompletado = v;
    }

    public LocalDateTime getMtpFechaCheck() {
        return mtpFechaCheck;
    }

    public void setMtpFechaCheck(LocalDateTime v) {
        this.mtpFechaCheck = v;
    }

    public Integer getMtpUsuarioId() {
        return mtpUsuarioId;
    }

    public void setMtpUsuarioId(Integer v) {
        this.mtpUsuarioId = v;
    }
}
