CREATE DATABASE virtual_lab;
USE virtual_lab;


DROP TABLE RESERVEBYDEVICE;
DROP TABLE RESERVEG;
DROP TABLE PRACTICE;
DROP TABLE ADMINISTRATOR;
DROP TABLE SPECIFICDEVICE;
DROP TABLE GENERALDEVICE;
DROP TABLE GENERALTYPE;
DROP TABLE DEVICEBYPRACTICE;

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
id INT(4) AUTO_INCREMENT,
state VARCHAR(50) NOT NULL,
type INT(4) NOT NULL,
 FOREIGN KEY (type) REFERENCES GENERALDEVICE(id),
  PRIMARY KEY(id));

CREATE TABLE PRACTICE(
  id INT(10) PRIMARY KEY AUTO_INCREMENT,
   name VARCHAR(100) NOT NULL,
   description VARCHAR(400) NOT NULL,
   pods boolean not null
);

CREATE TABLE RESERVEG(
   id  INT(10)PRIMARY KEY AUTO_INCREMENT,
   id_practice INT(10) NOT NULL,
   course VARCHAR(20) NOT NULL,
   day DATE NOT NULL,
   startHour TIME NOT NULL,
   endHour TIME NOT NULL,
   podsAmount INT(2) NOT NULL,
   FOREIGN KEY (id_practice) REFERENCES PRACTICE(id));

CREATE TABLE RESERVEBYDEVICE(
   reserve INT(10) NOT NULL,
   device INT(4) NOT NULL,
   FOREIGN KEY(device)REFERENCES SPECIFICDEVICE(id)  ON DELETE CASCADE,
   FOREIGN KEY(reserve) REFERENCES RESERVEG(id) ON DELETE CASCADE,
   PRIMARY KEY(reserve, device)
);

CREATE TABLE DEVICEBYPRACTICE(
   practice INT(10),
   device INT(4),
   FOREIGN KEY(practice) REFERENCES PRACTICE(id) ON DELETE CASCADE,
   FOREIGN KEY(device) REFERENCES GENERALDEVICE(id) ON DELETE CASCADE,
   PRIMARY KEY(practice, device)
);

INSERT INTO GENERALTYPE(name) VALUES ("SWL3");
INSERT INTO GENERALTYPE(name) VALUES ("SWL2");
INSERT INTO GENERALTYPE(name) VALUES ("ROUTER");
INSERT INTO GENERALTYPE(name) VALUES ("PC");

INSERT INTO GENERALDEVICE(id,name,type,description,amount,ports) VALUES (1,'Microtik',1,'Switche de nivel 3',10,20);

INSERT INTO PRACTICE(name, description, pods) values('vlans', 'Uso de vlans', true);
INSERT INTO RESERVEG(id_practice, course, day, startHour, endHour, podsAmount) values(1, 'COM1', '2020/10/25', 12-00-00, 02-00-00, 4);
INSERT INTO SPECIFICDEVICE(id, state, type)VALUES(1,'DISPONIBLE',1);
INSERT INTO RESERVEBYDEVICE(reserve, device)VALUES(1,1);
INSERT INTO DEVICEBYPRACTICE(practice, device)VALUES(2,1);