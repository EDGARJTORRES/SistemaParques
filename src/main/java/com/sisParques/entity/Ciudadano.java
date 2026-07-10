package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_ciudadano", schema = "sc_sistema")
public class Ciudadano {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ciud_id")
    private Integer ciudId;

    @Column(name = "ciud_nombres", length = 100, nullable = false)
    private String ciudNombres;

    @Column(name = "ciud_apellidos", length = 100, nullable = false)
    private String ciudApellidos;

    @Column(name = "ciud_tipo_documento", length = 20)
    private String ciudTipoDocumento;

    @Column(name = "ciud_numero_documento", length = 20)
    private String ciudNumeroDocumento;

    @Column(name = "ciud_telefono", length = 20)
    private String ciudTelefono;

    @Column(name = "ciud_email", length = 100)
    private String ciudEmail;

    @Column(name = "ciud_direccion", columnDefinition = "TEXT")
    private String ciudDireccion;

    @Column(name = "ciud_estado", length = 1)
    private String ciudEstado;

    @Column(name = "ciud_fecha_registro", updatable = false)
    private LocalDateTime ciudFechaRegistro;

    @PrePersist
    protected void onCreate() {
        if (ciudFechaRegistro == null) {
            ciudFechaRegistro = LocalDateTime.now();
        }

        if (ciudEstado == null) {
            ciudEstado = "A";
        }
    }

    // Getters & Setters

    public Integer getCiudId() {
        return ciudId;
    }

    public void setCiudId(Integer ciudId) {
        this.ciudId = ciudId;
    }

    public String getCiudNombres() {
        return ciudNombres;
    }

    public void setCiudNombres(String ciudNombres) {
        this.ciudNombres = ciudNombres;
    }

    public String getCiudApellidos() {
        return ciudApellidos;
    }

    public void setCiudApellidos(String ciudApellidos) {
        this.ciudApellidos = ciudApellidos;
    }

    public String getCiudTipoDocumento() {
        return ciudTipoDocumento;
    }

    public void setCiudTipoDocumento(String ciudTipoDocumento) {
        this.ciudTipoDocumento = ciudTipoDocumento;
    }

    public String getCiudNumeroDocumento() {
        return ciudNumeroDocumento;
    }

    public void setCiudNumeroDocumento(String ciudNumeroDocumento) {
        this.ciudNumeroDocumento = ciudNumeroDocumento;
    }

    public String getCiudTelefono() {
        return ciudTelefono;
    }

    public void setCiudTelefono(String ciudTelefono) {
        this.ciudTelefono = ciudTelefono;
    }

    public String getCiudEmail() {
        return ciudEmail;
    }

    public void setCiudEmail(String ciudEmail) {
        this.ciudEmail = ciudEmail;
    }

    public String getCiudDireccion() {
        return ciudDireccion;
    }

    public void setCiudDireccion(String ciudDireccion) {
        this.ciudDireccion = ciudDireccion;
    }

    public String getCiudEstado() {
        return ciudEstado;
    }

    public void setCiudEstado(String ciudEstado) {
        this.ciudEstado = ciudEstado;
    }

    public LocalDateTime getCiudFechaRegistro() {
        return ciudFechaRegistro;
    }

    public void setCiudFechaRegistro(LocalDateTime ciudFechaRegistro) {
        this.ciudFechaRegistro = ciudFechaRegistro;
    }
}