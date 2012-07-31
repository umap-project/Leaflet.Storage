#!/usr/bin/env python
# -*- coding: utf-8 -*-

import codecs

from setuptools import setup, find_packages

import chickpea

long_description = codecs.open('README.rst', "r", "utf-8").read()

setup(
    name="django-chickpea",
    version=chickpea.__version__,
    author=chickpea.__author__,
    author_email=chickpea.__contact__,
    description=chickpea.__doc__,
    keywords="django leaflet geodjango",
    url=chickpea.__homepage__,
    download_url="https://github.com/yohanboniface/django-chickpea/downloads",
    packages=find_packages(),
    include_package_data=True,
    platforms=["any"],
    zip_safe=True,

    long_description=long_description,

    classifiers=[
        "Development Status :: 3 - Alpha",
        #"Environment :: Web Environment",
        "Intended Audience :: Developers",
        #"License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Programming Language :: Python",
    ],
)
