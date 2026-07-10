package com.sisParques.dto;

import lombok.Data;

@Data
public class UsuarioDTO {

    private Integer idUsuario;
    private Integer idRol;

    private String dni;
    private String nombres;

    private String email;
    private String password;

    private Boolean activo;
    private String nmrCelular;

    private String totpSecret;
    private Boolean totpActivo;
    private String nombreRol;

}