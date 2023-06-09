# Makefile for Template Project
# Author: Kang Yang
# Email: y2603012723@163.com，Welcome feedback error
# Date: 2023-03-20 init version
# Description: This is a universal Makefile for Project,It can recursively traverse all sub file compilation and perform incremental compilation when dependent files change.

SHELL = /bin/bash
.PHONY:TargetBin

#判断输出路经是否被定义
ifdef outDir
$(info outDir = $(outDir))
else
$(error outDir not defined!)
endif

# #判断编译类型是否被定义
# ifdef compileType
# $(info compileType = $(compileType))
# else
# $(error compileType not defined!)
# endif

#判断工程名是否被定义
ifdef projectName
$(info projectName = $(projectName))
else
$(error projectName not defined!)
endif

#判断g++是否被定义
ifdef CXX
$(info CXX = $(CXX))
else
$(error CXX not defined!)
endif

#判断gcc是否被定义
ifdef CC
$(info CC = $(CC))
else
$(error CC not defined!)
endif

#判断全局宏是否被定义
ifdef MACRO
$(info MACRO = $(MACRO))
else
$(error MACRO not defined!)
endif

#判断静态库/动态库是否被定义
ifdef LIB
$(info LIB = $(LIB))
else
$(error LIB not defined!)
endif


#在此定义编译工具链
CXX = ${CXX}
CC = ${CC}

#添加全局宏定义
CPPFLAGS = ${MACRO}

#加库
CPPFLAGS += ${LIB}


# $(info compiletype = $(compileType))
#判断编译类型是debug还是release，从而设置不同的编译参数
ifdef BUILDVARIANTFLAGS
CPPFLAGS += ${BUILDVARIANTFLAGS}
else
$(error compileType parameter error!)
endif


#存储所有子目录和当前目录
AllDirs := $(shell ls -R | grep '^\./.*:$$' | awk '{gsub(":","");print}') .
$(info AllDirs = $(AllDirs))

#在所有子目录和当前目录找到所有源文件
Sources := $(foreach n,$(AllDirs),$(wildcard $(n)/*.cpp)) $(foreach n,$(AllDirs),$(wildcard $(n)/*.c))
$(info Source = $(Sources))

#定义要输出的所有.o
ObjsTmp:= $(addprefix $(BUILD_DIR),$(patsubst %.c,%.c.o,$(patsubst %.cpp,%.cpp.o,$(Sources))))
$(info objstmp = $(ObjsTmp))

#所有输出的.o加输出目录前缀
Objs = $(foreach n,$(ObjsTmp),$(shell echo $(n) | awk '{print "$(outDir)"substr($$0,2)}'))
$(info Objs = $(Objs))

#定义所有变动依赖输出文件，在sinclude加入makefile
Deps := $(patsubst %.o,%.d, $(Objs))
$(info deps = $(Deps))

#所有子目录和当前目录作为头文件目录
CPPFLAGS += $(foreach n,$(AllDirs) , -I$(n))

#定义输出执行文件名
#Bin := $(outDir)/$(shell echo $(outDir) | sed "s#\.\.\/##")
Bin := $(outDir)/$(projectName)

#伪目标依赖
TargetBin : $(Bin)

#执行文件依赖
$(Bin) : $(Objs)
	$(CXX) $(Objs) -o $@

#借助makefile命令输出所有依赖关系，目的是在文件变动时,能够识别重新编译，并执行增量编译动作
%.cpp.d : 
	$(CXX) -MT"$(@:.d=.o) $@" -M $(CPPFLAGS) $(shell echo $@ | sed "s#${outDir}#.#" | sed "s#\.cpp.d#\.cpp#") -MF $@
%.c.d : 
	$(CC) -MT"$(@:.d=.o) $@" -M $(CPPFLAGS) $(shell echo $@ | sed "s#${outDir}#.#" | sed "s#\.c.d#\.c#") -MF $@
%.cpp.o :
	$(CXX) -c $(CPPFLAGS) -o $@ $(shell echo $@ | sed "s#${outDir}#\.#" | sed "s#\.cpp.o#\.cpp#")
%.c.o :
	$(CC) -c $(CPPFLAGS) -o $@ $(shell echo $@ | sed "s#${outDir}#\.#" | sed "s#\.c.o#\.c#")

#将所有依赖关系包含进makefile
sinclude $(Deps)
