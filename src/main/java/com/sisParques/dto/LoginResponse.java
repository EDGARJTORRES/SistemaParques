package com.sisParques.dto;

public class LoginResponse {

    private String token;
    private Integer idUsuario; // 🔥 NUEVO CAMPO
    private String nombre;
    private String email;
    private Integer rolId;
    private String nombreRol;
    private Boolean totpActivo;

    public LoginResponse() {
    }

    public LoginResponse(String token, Integer idUsuario, String nombre, String email, Integer rolId, String nombreRol, Boolean totpActivo) {
        this.token = token;
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.email = email;
        this.rolId = rolId;
        this.nombreRol = nombreRol;
        this.totpActivo = totpActivo;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getRolId() {
        return rolId;
    }

    public void setRolId(Integer rolId) {
        this.rolId = rolId;
    }

    public String getNombreRol() {
        return nombreRol;
    }


    public void setNombreRol(String nombreRol) {
        this.nombreRol = nombreRol;
    }

    public Boolean getTotpActivo() {
        return totpActivo;
    }

    public void setTotpActivo(Boolean totpActivo) {
        this.totpActivo = totpActivo;
    }
}
