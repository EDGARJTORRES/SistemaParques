package com.sisParques.dto;

import java.time.LocalDateTime;

public class CiudadanoDTO {

    private Integer ciudId;
    private String ciudNombres;
    private String ciudApellidos;
    private String ciudTipoDocumento;
    private String ciudNumeroDocumento;
    private String ciudTelefono;
    private String ciudEmail;
    private String ciudDireccion;
    private String ciudEstado;
    private LocalDateTime ciudFechaRegistro;

    public Integer getCiudId() { return ciudId; }
    public void setCiudId(Integer ciudId) { this.ciudId = ciudId; }

    public String getCiudNombres() { return ciudNombres; }
    public void setCiudNombres(String ciudNombres) { this.ciudNombres = ciudNombres; }

    public String getCiudApellidos() { return ciudApellidos; }
    public void setCiudApellidos(String ciudApellidos) { this.ciudApellidos = ciudApellidos; }

    public String getCiudTipoDocumento() { return ciudTipoDocumento; }
    public void setCiudTipoDocumento(String ciudTipoDocumento) { this.ciudTipoDocumento = ciudTipoDocumento; }

    public String getCiudNumeroDocumento() { return ciudNumeroDocumento; }
    public void setCiudNumeroDocumento(String ciudNumeroDocumento) { this.ciudNumeroDocumento = ciudNumeroDocumento; }

    public String getCiudTelefono() { return ciudTelefono; }
    public void setCiudTelefono(String ciudTelefono) { this.ciudTelefono = ciudTelefono; }

    public String getCiudEmail() { return ciudEmail; }
    public void setCiudEmail(String ciudEmail) { this.ciudEmail = ciudEmail; }

    public String getCiudDireccion() { return ciudDireccion; }
    public void setCiudDireccion(String ciudDireccion) { this.ciudDireccion = ciudDireccion; }

    public String getCiudEstado() { return ciudEstado; }
    public void setCiudEstado(String ciudEstado) { this.ciudEstado = ciudEstado; }

    public LocalDateTime getCiudFechaRegistro() { return ciudFechaRegistro; }
    public void setCiudFechaRegistro(LocalDateTime ciudFechaRegistro) { this.ciudFechaRegistro = ciudFechaRegistro; }
}