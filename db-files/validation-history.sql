CREATE TABLE `validationHistory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studyName` varchar(128) NOT NULL,
  `jobId` varchar(128) NOT NULL,
  `startAt` datetime NOT NULL,
  `endAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8
