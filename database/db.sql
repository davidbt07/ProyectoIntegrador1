CREATE DATABASE virtual_lab;
USE virtual_lab;


DROP TABLE ADMINISTRATOR;
DROP TABLE SPECIFICDEVICE;
DROP TABLE GENERALDEVICE;
DROP TABLE GENERALTYPE;

CREATE TABLE GENERALTYPE(
 id INT(4) NOT NULL AUTO_INCREMENT,
 name VARCHAR(50) NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE ADMINISTRATOR(
 username VARCHAR(50) PRIMARY KEY,
 password VARCHAR(100) NOT NULL
);
CREATE  TABLE GENERALDEVICE(
   id  INT(4) NOT NULL AUTO_INCREMENT,
   name VARCHAR(100) NOT NULL,
   type INT(4) NOT NULL,
   description TEXT NOT NULL,
   amount INT(4) NOT NULL,
   ports INT(3) NOT NULL,
   PRIMARY KEY(id),
    FOREIGN KEY (type) REFERENCES GENERALTYPE(id)
);
CREATE TABLE SPECIFICDEVICE(
id INT(4) PRIMARY KEY,
state VARCHAR(50) NOT NULL,
type INT(4) NOT NULL,
 FOREIGN KEY (type) REFERENCES GENERALDEVICE(id));



 INSERT INTO GENERALTYPE VALUES (2,"SWL3");
  INSERT INTO GENERALTYPE VALUES (3,"SWL2");
   INSERT INTO GENERALTYPE VALUES (4,"ROUTER");
    INSERT INTO GENERALTYPE VALUES (5,"PC");
       INSERT INTO GENERALTYPE VALUES (6,"PC2");


DROP TABLE RESERVEG;
DROP TABLE PRACTICE;
DROP TABLE RESERVEBYDEVICE;

CREATE TABLE RESERVEG(
   id  INT(10)PRIMARY KEY AUTO_INCREMENT,
   id_practice INT(10) NOT NULL,
   course VARCHAR(20) NOT NULL,
   day DATE NOT NULL,
   startHour TIME NOT NULL,
   endHour TIME NOT NULL,
   FOREIGN KEY (id_practice) REFERENCES PRACTICE(id));

CREATE TABLE PRACTICE(
  id INT(10) PRIMARY KEY AUTO_INCREMENT,
   name VARCHAR(100) NOT NULL,
   description VARCHAR(400) NOT NULL,
   pods boolean not null
);

CREATE TABLE RESERVEBYDEVICE(
   reserve INT(10) NOT NULL,
   device INT(4) NOT NULL,
   FOREIGN KEY(device)REFERENCES SPECIFICDEVICE(id),
   FOREIGN KEY(reserve) REFERENCES RESERVEG(id),
   PRIMARY KEY(reserve, device)
);

INSERT INTO RESERVEG(id_practice, course, day, startHour, endHour) values(1, 'COM1', '2020/10/25', 12-00-00, 02-00-00);
INSERT INTO PRACTICE(name, description, pods) values('vlans', 'Uso de vlans', true);
INSERT INTO SPECIFICDEVICE(id, state, type)VALUES(1,'DISPONIBLE',4);
INSERT INTO RESERVEBYDEVICE(reserve, device)VALUES(2,1);
